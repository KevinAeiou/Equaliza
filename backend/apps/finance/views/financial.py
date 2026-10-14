from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsFamilyMember, IsRecordOwner
from apps.finance.filters import FinancialFilter
from apps.finance.services.export_financial import ExportFinancialService


# CRUD de receitas e despesas; as subclasses definem o service e os serializers.
# (Comentário, e não docstring, para não virar descrição na documentação da API.)
class FinancialViewSet(viewsets.ModelViewSet):
    service = None
    create_serializer_class = None
    update_serializer_class = None
    list_serializer_class = None

    filter_backends = [DjangoFilterBackend]
    filterset_class = FinancialFilter
    permission_classes = [
        IsAuthenticated,
        IsFamilyMember,
        IsRecordOwner,
    ]

    lookup_field = "pk"
    export_title = "Lançamentos"
    export_name = "lancamentos"

    def get_serializer_class(self):
        if self.action == "create":
            return self.create_serializer_class

        if self.action in ["update", "partial_update"]:
            return self.update_serializer_class

        return self.list_serializer_class

    def get_queryset(self):
        return self.service.list(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        instance = self.service.create(
            user=request.user,
            data=serializer.validated_data,
        )

        return Response(
            self.list_serializer_class(instance).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=kwargs.get("partial", False),
        )
        serializer.is_valid(raise_exception=True)

        instance = self.service.update(
            instance=instance,
            data=serializer.validated_data,
        )

        return Response(self.list_serializer_class(instance).data)

    def destroy(self, request, *args, **kwargs):
        self.service.delete(self.get_object())

        return Response(status=status.HTTP_204_NO_CONTENT)

    # Usa `export_format` porque `format` é reservado pelo DRF para negociação de conteúdo.
    @extend_schema(
        parameters=[
            OpenApiParameter("export_format", OpenApiTypes.STR, enum=["csv", "pdf"], required=True),
        ],
        responses={(200, "application/octet-stream"): OpenApiTypes.BINARY},
    )
    @action(detail=False, methods=["get"], pagination_class=None)
    def export(self, request):
        export_format = request.query_params.get("export_format")

        if export_format not in ("csv", "pdf"):
            raise serializers.ValidationError({"export_format": "Use csv ou pdf."})

        queryset = self.filter_queryset(self.get_queryset())
        filename = f"{self.export_name}-{timezone.localdate():%Y-%m-%d}.{export_format}"

        if export_format == "csv":
            content = ExportFinancialService.to_csv(queryset)
            content_type = "text/csv; charset=utf-8"
        else:
            content = ExportFinancialService.to_pdf(queryset, self.export_title)
            content_type = "application/pdf"

        response = HttpResponse(content, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response
