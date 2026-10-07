from rest_framework.pagination import PageNumberPagination


class OptionalPageNumberPagination(PageNumberPagination):
    """Pagina só quando o cliente pede (`?page_size=N`); sem o parâmetro mantém a lista completa.

    Preserva o formato atual (lista simples) para os clientes que ainda não paginam.
    """

    page_size = None
    page_size_query_param = "page_size"
    max_page_size = 200

    def get_paginated_response_schema(self, schema):
        # `schema` já é a lista de itens. Sem `page_size` a resposta é essa lista simples;
        # com ele, o objeto paginado.
        return {"oneOf": [schema, super().get_paginated_response_schema(schema)]}

    def paginate_queryset(self, queryset, request, view=None):
        if self.page_size_query_param not in request.query_params:
            return None

        return super().paginate_queryset(queryset, request, view)
