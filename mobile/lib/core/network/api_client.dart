import 'package:dio/dio.dart';

import '../config/env.dart';

/// Cliente HTTP compartilhado para comunicação com o backend.
///
/// Os timeouts são longos porque o plano gratuito do Render desliga o
/// backend quando ocioso, e a primeira requisição pode levar até um minuto.
final Dio api = Dio(
  BaseOptions(
    baseUrl: '${Env.apiUrl}/api',
    connectTimeout: const Duration(seconds: 60),
    receiveTimeout: const Duration(seconds: 60),
    headers: {'Accept': 'application/json'},
  ),
);
