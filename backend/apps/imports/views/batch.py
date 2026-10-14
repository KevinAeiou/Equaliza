from django.db import transaction
from django.db.models import Count, Exists, OuterRef, Q
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.imports.enums import PendingStatus
from apps.imports.exceptions import FileTooLarge
from apps.imports.models import ImportBatch, PendingTransaction
from apps.imports.permissions import StatementImportEnabled
from apps.imports.serializers import ImportBatchSerializer, UploadSerializer
from apps.imports.services import UploadImportService
from apps.imports.upload import MULTIPART_OVERHEAD, LimitedMemoryUploadHandler
from django.conf import settings


class ImportBatchViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, StatementImportEnabled]
    parser_classes = [MultiPartParser]
    serializer_class = ImportBatchSerializer
    queryset = ImportBatch.objects.none()  # só para o schema; get_queryset define o real
    throttle_scope = "import_upload"

    def get_throttles(self):
        # Só o envio de arquivo é limitado; listar e remover seguem livres.
        return [ScopedRateThrottle()] if self.action == "create" else []

    def initial(self, request, *args, **kwargs):
        if self.action == "create":
            # O arquivo fica só em memória: nunca em arquivo temporário no disco.
            length = int(request.META.get("CONTENT_LENGTH") or 0)

            if length > settings.IMPORT_MAX_FILE_BYTES + MULTIPART_OVERHEAD:
                raise FileTooLarge()

            request._request.upload_handlers = [LimitedMemoryUploadHandler(request._request)]

        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        queryset = ImportBatch.objects.filter(owner=self.request.user).annotate(
            pending_count=Count("transactions", filter=Q(transactions__status=PendingStatus.PENDING))
        )

        # Um reenvio sem linhas novas cria um lote vazio: não há o que mostrar nem remover.
        if self.action == "list":
            queryset = queryset.filter(Exists(PendingTransaction.objects.filter(batch=OuterRef("pk"))))

        return queryset

    def get_serializer_class(self):
        return UploadSerializer if self.action == "create" else ImportBatchSerializer

    @extend_schema(request={"multipart/form-data": UploadSerializer}, responses={201: ImportBatchSerializer})
    def create(self, request, *args, **kwargs):
        serializer = UploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        mapping = data.get("mapping")

        batch = UploadImportService.execute(
            owner=request.user,
            uploaded_file=data["file"],
            source=data["source"],
            password=data.get("password"),
            layout=mapping.to_layout() if mapping else None,
        )
        batch.pending_count = batch.rows_new

        return Response(ImportBatchSerializer(batch).data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def perform_destroy(self, instance):
        """Desfaz o lote: remove só o que ainda está pendente. O que já foi tratado fica
        (despesas registradas permanecem, e as linhas lidas continuam impedindo reaparição)."""
        instance.transactions.filter(status=PendingStatus.PENDING).delete()

        if not instance.transactions.exists():
            instance.delete()
