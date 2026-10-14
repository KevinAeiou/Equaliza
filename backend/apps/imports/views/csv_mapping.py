from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.imports.models import CsvMapping
from apps.imports.permissions import StatementImportEnabled
from apps.imports.serializers import CsvMappingSerializer


class CsvMappingViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, StatementImportEnabled]
    serializer_class = CsvMappingSerializer
    queryset = CsvMapping.objects.none()  # só para o schema; get_queryset define o real

    def get_queryset(self):
        return CsvMapping.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
