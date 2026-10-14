from django.conf import settings
from django.core.files.uploadhandler import MemoryFileUploadHandler, StopUpload

# Margem para o cabeçalho multipart e os demais campos do formulário.
MULTIPART_OVERHEAD = 64 * 1024


class LimitedMemoryUploadHandler(MemoryFileUploadHandler):
    """Mantém o arquivo sempre em memória (nunca em arquivo temporário no disco) e corta o
    envio que passar do limite, mesmo sem Content-Length."""

    def handle_raw_input(self, input_data, META, content_length, boundary, encoding=None):
        self.received = 0

        return super().handle_raw_input(input_data, META, content_length, boundary, encoding)

    def receive_data_chunk(self, raw_data, start):
        self.received += len(raw_data)

        if self.received > settings.IMPORT_MAX_FILE_BYTES + MULTIPART_OVERHEAD:
            raise StopUpload(connection_reset=True)

        return super().receive_data_chunk(raw_data, start)
