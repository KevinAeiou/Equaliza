import io
import zipfile
from datetime import date
from decimal import Decimal

from django.test import SimpleTestCase, TestCase, override_settings

from apps.imports.enums import Direction, ImportFormat, ImportSource, PendingFlag
from apps.imports.models import CsvMapping, PendingTransaction
from apps.imports.parsers import (
    NeedsMapping,
    ParseError,
    PasswordRequired,
    UnsupportedFormat,
    WrongPassword,
    parse_csv,
    parse_upload,
)
from apps.imports.services import CreateImportBatchService, UploadRejected
from apps.imports.tests.helpers import zipcrypto_zip
from apps.users.models import User

NUBANK_STATEMENT = (
    "Data,Valor,Identificador,Descrição\n"
    "05/09/2026,-45.90,id-1,Compra no débito - Mercado\n"
    "10/09/2026,3000.00,id-2,Transferência recebida - Empresa X\n"
    "20/09/2026,-800.50,id-3,Pagamento de fatura\n"
).encode()

NUBANK_CARD = (
    "date,category,title,amount\n"
    "2026-08-01,restaurante,Café & Cia,19.99\n"
    "2026-08-10,,Pagamento recebido,-500.00\n"
).encode()

C6_CARD = (
    "Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)\n"
    "10/09/2026;FULANO DE TAL;1234;Supermercados;MERCADO CENTRAL;Única;0;0;R$ 120,50\n"
    "12/09/2026;FULANO DE TAL;1234;Eletrônicos;LOJA X;2/6;0;0;R$ 1.299,90\n"
    "15/09/2026;FULANO DE TAL;5678;Estorno;ESTORNO LOJA Y;Única;0;0;-R$ 30,00\n"
).encode("utf-8")


class CsvModelsTests(SimpleTestCase):
    def test_nubank_statement(self):
        layout, rows = parse_csv(NUBANK_STATEMENT)
        debit, credit, payment = rows

        self.assertEqual((layout.name, layout.source), ("Nubank (extrato)", ImportSource.STATEMENT))
        self.assertEqual((debit.direction, debit.amount), (Direction.DEBIT, Decimal("45.90")))
        self.assertEqual((debit.occurred_at, debit.external_id), (date(2026, 9, 5), "id-1"))
        self.assertEqual(credit.direction, Direction.CREDIT)
        self.assertEqual(payment.flag, PendingFlag.CARD_PAYMENT)

    def test_nubank_card_positive_is_purchase(self):
        layout, rows = parse_csv(NUBANK_CARD)

        self.assertEqual(layout.source, ImportSource.CARD_INVOICE)
        self.assertEqual((rows[0].direction, rows[0].source_category), (Direction.DEBIT, "restaurante"))
        self.assertEqual(rows[0].description, "Café & Cia")
        self.assertEqual(rows[1].direction, Direction.CREDIT)

    def test_c6_card_amounts_installments_and_account(self):
        layout, rows = parse_csv(C6_CARD)

        self.assertEqual(layout.name, "C6 (fatura)")
        self.assertEqual(rows[0].amount, Decimal("120.50"))
        self.assertEqual((rows[0].description, rows[0].account_ref), ("MERCADO CENTRAL", "1234"))
        self.assertEqual((rows[1].amount, rows[1].description), (Decimal("1299.90"), "LOJA X (2/6)"))
        self.assertEqual((rows[2].direction, rows[2].amount, rows[2].account_ref), (Direction.CREDIT, Decimal("30.00"), "5678"))
        self.assertEqual(rows[0].source_category, "Supermercados")

    def test_cardholder_name_is_never_kept(self):
        _, rows = parse_csv(C6_CARD)

        self.assertNotIn("FULANO", repr(rows))

    def test_latin1_semicolon_and_bom(self):
        latin = C6_CARD.decode().encode("cp1252")
        bom = b"\xef\xbb\xbf" + C6_CARD

        self.assertEqual(len(parse_csv(latin)[1]), 3)
        self.assertEqual(len(parse_csv(bom)[1]), 3)
        self.assertEqual(parse_csv(latin)[1][1].description, "LOJA X (2/6)")

    def test_unknown_csv_asks_for_mapping_with_headers_only(self):
        with self.assertRaises(NeedsMapping) as ctx:
            parse_csv(b"Dia;Quanto;Historico\n01/01/2026;10,00;Segredo\n")

        self.assertEqual(ctx.exception.headers, ["Dia", "Quanto", "Historico"])
        self.assertNotIn("Segredo", str(ctx.exception) + str(ctx.exception.headers))

    def test_user_mapping(self):
        mapping = CsvMapping(
            name="Banco X", date_column="Dia", amount_column="Quanto",
            description_column="Historico", decimal_separator="COMMA", debit_is_negative=True,
        )
        content = b"Dia;Quanto;Historico\n01/01/2026;-1.234,56;Aluguel\n02/01/2026;10,00;Rendimento\n"

        _, rows = parse_csv(content, layout=mapping.to_layout())

        self.assertEqual((rows[0].direction, rows[0].amount), (Direction.DEBIT, Decimal("1234.56")))
        self.assertEqual(rows[1].direction, Direction.CREDIT)

    def test_invalid_data_is_rejected_generically(self):
        for bad in (
            b"Data,Valor,Identificador,Descri\xc3\xa7\xc3\xa3o\n99/99/2026,-1.00,x,Segredo\n",
            b"Data,Valor,Identificador,Descri\xc3\xa7\xc3\xa3o\n01/01/2026,abc,x,Segredo\n",
            b"Data,Valor,Identificador,Descri\xc3\xa7\xc3\xa3o\n",
            b"\x00\x01\x02",
            b"",
        ):
            with self.assertRaises(ParseError) as ctx:
                parse_csv(bad)

            self.assertNotIn("Segredo", str(ctx.exception))

    def test_limits(self):
        with self.assertRaises(ParseError):
            parse_csv(NUBANK_STATEMENT, max_rows=2)

        with self.assertRaises(ParseError):
            parse_csv((",".join(f"c{i}" for i in range(60)) + "\n1\n").encode())

    def test_formula_text_is_kept_as_plain_text(self):
        content = NUBANK_STATEMENT.replace(b"Compra no", b"=HYPERLINK(x) Compra no")

        self.assertTrue(parse_csv(content)[1][0].description.startswith("=HYPERLINK"))


class UploadDetectionTests(SimpleTestCase):
    def test_zip_with_password_is_opened_in_memory(self):
        content = zipcrypto_zip("fatura.csv", C6_CARD, "123456")

        fmt, rows, source = parse_upload(content, password="123456")

        self.assertEqual((fmt, len(rows), source), (ImportFormat.CSV, 3, ImportSource.CARD_INVOICE))

    def test_zip_password_errors(self):
        content = zipcrypto_zip("fatura.csv", C6_CARD, "123456")

        with self.assertRaises(PasswordRequired):
            parse_upload(content)

        with self.assertRaises(WrongPassword):
            parse_upload(content, password="000000")

    def test_zip_structure_is_restricted(self):
        def build(files):
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w") as archive:
                for name, data in files.items():
                    archive.writestr(name, data)
            return buffer.getvalue()

        for files in ({"a.csv": C6_CARD, "b.csv": C6_CARD}, {"a.xlsx": b"x"}, {}):
            with self.assertRaises(ParseError):
                parse_upload(build(files))

        self.assertEqual(parse_upload(build({"ok.csv": C6_CARD}))[0], ImportFormat.CSV)

    def test_compression_bomb_is_rejected(self):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("bomba.csv", b"0" * 2_000_000)

        with self.assertRaises(ParseError):
            parse_upload(buffer.getvalue())

    def test_oversized_uncompressed_is_rejected(self):
        content = zipcrypto_zip("fatura.csv", C6_CARD, "1")

        with override_settings(IMPORT_MAX_FILE_BYTES=len(C6_CARD) - 1):
            with self.assertRaises((ParseError, UploadRejected)):
                parse_upload(content, password="1")

    def test_garbage_zip(self):
        with self.assertRaises(ParseError):
            parse_upload(b"PK\x03\x04lixo")

    def test_ofx_and_pdf_and_empty(self):
        ofx = b"<OFX><BANKMSGSRSV1><STMTTRN><DTPOSTED>20260801</DTPOSTED><TRNAMT>-1</TRNAMT></STMTTRN></BANKMSGSRSV1></OFX>"

        self.assertEqual(parse_upload(ofx)[0], ImportFormat.OFX)

        with self.assertRaises(UnsupportedFormat):
            parse_upload(b"%PDF-1.7 ...")

        with self.assertRaises(UploadRejected):
            parse_upload(b"")

    def test_detection_ignores_file_extension(self):
        # O parser nem recebe o nome do arquivo: um OFX "renomeado" continua sendo OFX.
        self.assertEqual(parse_upload(NUBANK_STATEMENT)[0], ImportFormat.CSV)


class CsvImportIntegrationTests(TestCase):
    def test_c6_zip_to_pending_transactions(self):
        user = User.objects.create_user(email="a@example.com", password="x", first_name="A")
        content = zipcrypto_zip("fatura.csv", C6_CARD, "123456")
        fmt, rows, source = parse_upload(content, password="123456")

        first = CreateImportBatchService.execute(user, source, fmt, content, rows)
        again = CreateImportBatchService.execute(user, source, fmt, content, rows)

        self.assertEqual((first.rows_new, again.rows_new), (3, 0))
        self.assertEqual(PendingTransaction.objects.filter(account_ref="5678").count(), 1)
