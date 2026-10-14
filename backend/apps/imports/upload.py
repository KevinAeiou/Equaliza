from django.conf import settings
from django.core.files.uploadhandler import MemoryFileUploadHandler, StopUpload

# Margem para o cabeçalho multipart e os demais campos do formulário.
MULTIPART_OVERHEAD = 64 * 1024


class LimitedMemoryUploadHandler(MemoryFileUploadHandler):
    """Mantém o arquivo sempre em memória (nunca em arquivo temporário no disco) e corta o
    envio que passar do limite, mesmo sem Content-Length."""

    def handle_raw_input(self, input_data, META, content_length, boundary, encoding=None):
        self.received = 0
        result = super().handle_raw_input(input_data, META, content_length, boundary, encoding)

        # O handler do Django só se ativa até FILE_UPLOAD_MAX_MEMORY_SIZE (2,5 MB por padrão) e,
        # acima disso, deixaria o arquivo sem handler. Aqui o limite é o IMPORT_MAX_FILE_BYTES.
        self.activated = True

        return result

    def receive_data_chunk(self, raw_data, start):
        self.received += len(raw_data)

        if self.received > settings.IMPORT_MAX_FILE_BYTES + MULTIPART_OVERHEAD:
            raise StopUpload(connection_reset=True)

        return super().receive_data_chunk(raw_data, start)
