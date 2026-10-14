class ParseError(ValueError):
    """Arquivo recusado. A mensagem é genérica de propósito: nunca inclui trechos do arquivo."""


class PasswordRequired(ParseError):
    pass


class WrongPassword(ParseError):
    pass


class UnsupportedFormat(ParseError):
    pass


class NeedsMapping(ParseError):
    """CSV de um modelo desconhecido; leva só os nomes das colunas, para o usuário mapear."""

    def __init__(self, headers):
        super().__init__("Formato de CSV não reconhecido. Informe o mapeamento das colunas.")
        self.headers = headers
