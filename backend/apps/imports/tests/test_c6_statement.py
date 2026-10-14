from datetime import date
from decimal import Decimal

from django.test import SimpleTestCase

from apps.imports.enums import Direction, PendingFlag
from apps.imports.parsers import UnsupportedFormat
from apps.imports.parsers.c6_statement import parse_c6_statement_text, split_kind
from apps.imports.tests import c6_samples


class C6StatementParserTests(SimpleTestCase):
    def check(self, text):
        result = parse_c6_statement_text(text)
        iof, pix_in, card, salary, payment, pix_out = result.rows

        self.assertEqual(len(result.rows), 6)
        self.assertEqual((iof.direction, iof.amount, iof.occurred_at), (Direction.DEBIT, Decimal("0.75"), date(2026, 10, 2)))
        self.assertEqual((iof.kind, iof.description), ("Outros gastos", "IOF CHEQUE ESPECIAL"))
        self.assertEqual((pix_in.direction, pix_in.amount, pix_in.kind), (Direction.CREDIT, Decimal("300.00"), "Entrada PIX"))
        self.assertEqual((card.kind, card.description), ("Débito de Cartão", "PADARIA CENTRAL Manaus BRA"))
        self.assertEqual(salary.amount, Decimal("3000.00"))
        self.assertEqual((payment.flag, payment.description), (PendingFlag.CARD_PAYMENT, "PGTO FAT CARTAO C6"))
        self.assertEqual((pix_out.kind, pix_out.amount), ("Saída PIX", Decimal("308.00")))
        self.assertEqual(result.account_ref, "2222")
        self.assertEqual((result.period_start, result.period_end), (date(2026, 9, 29), date(2026, 10, 14)))
        self.assertEqual((result.parsed_in, result.parsed_out), (c6_samples.EXPECTED_IN, c6_samples.EXPECTED_OUT))
        self.assertEqual((result.pdf_in, result.pdf_out), (c6_samples.EXPECTED_IN, c6_samples.EXPECTED_OUT))
        self.assertTrue(result.matches)

        return result

    def test_one_row_per_line(self):
        self.check(c6_samples.as_lines())

    def test_one_cell_per_line(self):
        self.check(c6_samples.as_cells())

    def test_balance_rows_and_headers_are_not_transactions(self):
        result = parse_c6_statement_text(c6_samples.as_lines())

        self.assertFalse(any("Saldo" in row.description for row in result.rows))
        self.assertFalse(any("Setembro" in row.description or "Entradas" in row.description for row in result.rows))

    def test_holder_name_and_document_are_never_kept(self):
        result = parse_c6_statement_text(c6_samples.as_lines())

        self.assertNotIn("FICTICIA", repr(result))
        self.assertNotIn("000.000.000-00", repr(result))
        self.assertNotIn("111112222", repr(result))

    def test_total_mismatch_is_detected(self):
        text = c6_samples.as_lines().replace("R$ 3.000,00", "R$ 2.000,00")

        result = parse_c6_statement_text(text)

        self.assertFalse(result.matches)

    def test_a_missed_row_is_detected_by_the_totals(self):
        text = c6_samples.as_lines().replace("06/10 06/10 Saída PIX Pix enviado para BELTRANO SOUZA 00238167240 -R$ 308,00", "")

        result = parse_c6_statement_text(text)

        self.assertEqual(len(result.rows), 5)
        self.assertFalse(result.matches)

    def test_unknown_kind_stays_with_the_description(self):
        text = c6_samples.as_lines().replace("Outros gastos IOF", "Tipo Novo IOF")

        row = parse_c6_statement_text(text).rows[0]

        self.assertEqual(row.kind, "")
        self.assertEqual(row.description, "Tipo Novo IOF CHEQUE ESPECIAL")
        self.assertEqual(split_kind("Entrada PIX Pix recebido"), ("Entrada PIX", "Pix recebido"))

    def test_period_across_years_picks_the_right_year(self):
        text = (
            c6_samples.as_lines()
            .replace("29 de setembro de 2026 até 14 de outubro de 2026", "20 de dezembro de 2025 até 10 de janeiro de 2026")
            .replace("02/10 01/10", "28/12 28/12")
            .replace("03/10", "03/01")
        )

        rows = parse_c6_statement_text(text).rows

        self.assertEqual(rows[0].occurred_at, date(2025, 12, 28))
        self.assertEqual(rows[1].occurred_at, date(2026, 1, 3))

    def test_not_a_c6_statement_is_refused_with_a_generic_message(self):
        for text in ("Fatura do cartão Segredo de Fulano 05/10 10,00", "", "C6 extrato sem tabela Segredo"):
            with self.assertRaises(UnsupportedFormat) as ctx:
                parse_c6_statement_text(text)

            self.assertNotIn("Segredo", str(ctx.exception))
