from datetime import date
from decimal import Decimal

from django.test import SimpleTestCase, TestCase

from apps.imports.enums import Direction, ImportFormat, ImportSource, PendingFlag
from apps.imports.models import PendingTransaction
from apps.imports.services import CreateImportBatchService
from apps.users.models import User
from apps.imports.parsers import OfxParseError, looks_like_ofx, parse_ofx

SGML = """OFXHEADER:100
DATA:OFXSGML
VERSION:102
CHARSET:1252

<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<BANKACCTFROM><BANKID>260<ACCTID>12345-6</BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260905120000[-3:BRT]
<TRNAMT>-45.90
<FITID>abc-1
<MEMO>Compra no débito - Mercado
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260910
<TRNAMT>3000.00
<FITID>abc-2
<NAME>Empresa X
<MEMO>Salário
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260920
<TRNAMT>-800,50
<FITID>abc-3
<NAME>Pagamento de fatura
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>
""".encode("cp1252")

XML = b"""<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="220"?>
<OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS>
<CCACCTFROM><ACCTID>5555444433339876</ACCTID></CCACCTFROM>
<BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260801</DTPOSTED>
<TRNAMT>-19.99</TRNAMT><FITID>x1</FITID><MEMO>Caf&amp;Cia</MEMO></STMTTRN>
</BANKTRANLIST></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>"""


class OfxParserTests(SimpleTestCase):
    def test_sgml_statement(self):
        result = parse_ofx(SGML)
        debit, credit, payment = result.rows

        self.assertEqual(result.source_hint, ImportSource.STATEMENT)
        self.assertEqual(len(result.rows), 3)
        self.assertEqual(debit.direction, Direction.DEBIT)
        self.assertEqual(debit.amount, Decimal("45.90"))
        self.assertEqual(debit.occurred_at, date(2026, 9, 5))
        self.assertEqual(debit.description, "Compra no débito - Mercado")
        self.assertEqual((debit.external_id, debit.account_ref), ("abc-1", "3456"))
        self.assertEqual(credit.direction, Direction.CREDIT)
        self.assertEqual((credit.description, credit.counterparty), ("Salário", "Empresa X"))
        self.assertEqual(payment.amount, Decimal("800.50"))
        self.assertEqual(payment.flag, PendingFlag.CARD_PAYMENT)
        self.assertEqual(debit.flag, "")

    def test_xml_credit_card_and_entities(self):
        result = parse_ofx(XML)

        self.assertEqual(result.source_hint, ImportSource.CARD_INVOICE)
        self.assertEqual(result.rows[0].account_ref, "9876")
        self.assertEqual(result.rows[0].description, "Caf&Cia")

    def test_invert_sign_for_issuers_that_use_positive_charges(self):
        xml = XML.replace(b"-19.99", b"19.99")

        self.assertEqual(parse_ofx(xml).rows[0].direction, Direction.CREDIT)
        self.assertEqual(parse_ofx(xml, invert_sign=True).rows[0].direction, Direction.DEBIT)

    def test_external_entities_are_never_resolved(self):
        evil = b"""<?xml version="1.0"?>
<!DOCTYPE OFX [<!ENTITY xxe SYSTEM "file:///etc/passwd"><!ENTITY a "&xxe;&xxe;">]>
<OFX><BANKMSGSRSV1><STMTTRN><DTPOSTED>20260801</DTPOSTED><TRNAMT>-1.00</TRNAMT>
<FITID>1</FITID><MEMO>&xxe; &a;</MEMO></STMTTRN></BANKMSGSRSV1></OFX>"""

        row = parse_ofx(evil).rows[0]

        self.assertNotIn("root:", row.description)
        self.assertEqual(row.description, "&xxe; &a;")

    def test_detection_by_content(self):
        self.assertTrue(looks_like_ofx(SGML))
        self.assertTrue(looks_like_ofx(XML))
        self.assertTrue(looks_like_ofx(b"\xef\xbb\xbf<OFX></OFX>"))
        self.assertFalse(looks_like_ofx(b"Data;Valor;Descricao\n"))

    def test_rejects_garbage_with_generic_message(self):
        for bad in (b"nada", b"\x00\x01<OFX>", b"<OFX><STMTTRN><TRNAMT>1</TRNAMT></STMTTRN></OFX>"):
            with self.assertRaises(OfxParseError) as ctx:
                parse_ofx(bad)

            self.assertNotIn("nada", str(ctx.exception))

    def test_rejects_invalid_values(self):
        for field_, bad in (("TRNAMT", "abc"), ("TRNAMT", "NaN"), ("DTPOSTED", "20261340")):
            xml = XML.replace(
                b"<TRNAMT>-19.99</TRNAMT>" if field_ == "TRNAMT" else b"<DTPOSTED>20260801</DTPOSTED>",
                f"<{field_}>{bad}</{field_}>".encode(),
            )

            with self.assertRaises(OfxParseError):
                parse_ofx(xml)

    def test_row_limit_and_huge_input_stay_bounded(self):
        body = b"<STMTTRN><DTPOSTED>20260801</DTPOSTED><TRNAMT>-1</TRNAMT></STMTTRN>" * 10
        content = b"<OFX>" + body + b"</OFX>"

        with self.assertRaises(OfxParseError):
            parse_ofx(content, max_rows=5)

        self.assertEqual(len(parse_ofx(content, max_rows=10).rows), 10)


class OfxImportIntegrationTests(TestCase):
    def test_parsed_rows_become_deduplicated_pending_transactions(self):
        user = User.objects.create_user(email="a@example.com", password="x", first_name="A")
        rows = parse_ofx(SGML).rows

        first = CreateImportBatchService.execute(user, ImportSource.STATEMENT, ImportFormat.OFX, SGML, rows)
        again = CreateImportBatchService.execute(user, ImportSource.STATEMENT, ImportFormat.OFX, SGML, rows)

        self.assertEqual((first.rows_new, again.rows_new, again.rows_duplicated), (3, 0, 3))
        self.assertEqual(first.period_end, date(2026, 9, 20))
        self.assertEqual(
            PendingTransaction.objects.filter(flag=PendingFlag.CARD_PAYMENT).count(), 1
        )
