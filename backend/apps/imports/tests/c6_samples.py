"""Texto de extrato do C6 com a estrutura do PDF real, mas com nomes, números e valores fictícios."""

from decimal import Decimal

HEADER = """Extrato exportado no dia 14 de outubro de 2026 às 11:06
MARIA FICTICIA DA SILVA • 000.000.000-00
Agência: 1 • Conta: 111112222
C6BANK
Extrato
Período • 29 de setembro de 2026 até 14 de outubro de 2026
Saldo do dia • 14 de outubro de 2026 • R$ 0,00
Setembro 2026 ( 29/09/2026 - 30/09/2026 ) Entradas: R$ 0,00 • Saídas: R$ 0,00
Sem lançamentos no mês
Outubro 2026 ( 01/10/2026 - 14/10/2026 ) Entradas: R$ 3.300,00 • Saídas: R$ 1.250,75
Data lançamento Data contábil Tipo Descrição Valor
"""

# (lançamento, contábil, tipo, descrição, valor como aparece no PDF)
ROWS = [
    ("02/10", "01/10", "Outros gastos", "IOF CHEQUE ESPECIAL", "-R$ 0,75"),
    ("03/10", "05/10", "Entrada PIX", "Pix recebido de FULANO DE TAL", "R$ 300,00"),
    ("05/10", "05/10", "Débito de Cartão", "PADARIA CENTRAL Manaus BRA", "-R$ 12,00"),
    ("06/10", "06/10", "Entrada PIX", "Pix recebido c6 de 00.000.000 EMPRESA X LTDA", "R$ 3.000,00"),
    ("06/10", "06/10", "Pagamento", "PGTO FAT CARTAO C6", "-R$ 930,00"),
    ("06/10", "06/10", "Saída PIX", "Pix enviado para BELTRANO SOUZA 00238167240", "-R$ 308,00"),
]
EXPECTED_IN = Decimal("3300.00")
EXPECTED_OUT = Decimal("1250.75")


def as_lines():
    """Um lançamento por linha, com 'Saldo do dia' no meio."""
    lines = [HEADER.rstrip("\n")]

    for index, row in enumerate(ROWS):
        lines.append(" ".join(row))

        if index == 2:
            lines.append("Saldo do dia 05/10/26 R$ 214,41")

    return "\n".join(lines)


def as_cells():
    """Uma célula por linha, como alguns extratores de PDF entregam as tabelas."""
    cells = [HEADER.rstrip("\n")]

    for index, row in enumerate(ROWS):
        cells.extend(row)

        if index == 2:
            cells.extend(["Saldo do dia 05/10/26", "R$ 214,41"])

    return "\n".join(cells)
