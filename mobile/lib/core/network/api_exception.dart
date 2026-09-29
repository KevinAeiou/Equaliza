import 'package:dio/dio.dart';

/// Erro da API com a mensagem já pronta para exibir ao usuário.
class ApiException implements Exception {
  const ApiException(this.message, {this.status, this.fieldErrors = const {}});

  final String message;
  final int? status;

  /// Mensagens de validação por campo (`{"email": ["..."]}`).
  final Map<String, String> fieldErrors;

  /// Converte um erro do Dio seguindo a mesma regra do `configureError` do web:
  /// `detail` primeiro, depois a primeira mensagem de campo.
  factory ApiException.from(Object error, String action) {
    if (error is ApiException) return error;

    if (error is! DioException) {
      return ApiException('Erro desconhecido ao $action.');
    }

    final response = error.response;
    final data = response?.data;

    if (response == null) {
      final offline = error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout;

      return ApiException(
        offline
            ? 'Não foi possível conectar ao servidor. Verifique sua conexão.'
            : 'Falha ao $action.',
      );
    }

    final fieldErrors = <String, String>{};
    String? message;

    if (data is Map) {
      final detail = data['detail'];

      if (detail is String) message = detail;

      for (final entry in data.entries) {
        final value = entry.value;
        final text = value is List && value.isNotEmpty
            ? value.first.toString()
            : value is String
                ? value
                : null;

        if (text == null || entry.key == 'detail') continue;

        fieldErrors[entry.key.toString()] = text;
        message ??= text;
      }
    }

    return ApiException(
      message ?? 'Falha ao $action.',
      status: response.statusCode,
      fieldErrors: fieldErrors,
    );
  }

  @override
  String toString() => message;
}

/// Executa uma chamada à API convertendo falhas em [ApiException].
Future<T> guard<T>(String action, Future<T> Function() call) async {
  try {
    return await call();
  } catch (error) {
    throw ApiException.from(error, action);
  }
}
