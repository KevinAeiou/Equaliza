import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

import '../config/env.dart';

/// Cliente HTTP compartilhado para comunicação com o backend.
///
/// Os timeouts são longos porque o plano gratuito do Render desliga o
/// backend quando ocioso, e a primeira requisição pode levar até um minuto.
final Dio api = Dio(
  BaseOptions(
    // A barra final é necessária: o Dio concatena o caminho relativo à base.
    baseUrl: '${Env.apiUrl}/api/',
    connectTimeout: const Duration(seconds: 60),
    receiveTimeout: const Duration(seconds: 60),
    headers: {'Accept': 'application/json'},
  // `categories=1&categories=2`, como o `qs` com arrayFormat "repeat" do web.
    listFormat: ListFormat.multi,
  ),
);

/// Chamado quando a API responde 401 fora do login, para encerrar a sessão.
void Function()? onUnauthorized;

PersistCookieJar? _cookieJar;

/// A autenticação do backend é feita por cookies HttpOnly (access e refresh).
/// O cookie jar persistente guarda esses cookies entre aberturas do app e
/// recebe o access token renovado que o backend devolve automaticamente.
Future<void> setupApi() async {
  // No navegador (usado só para pré-visualização) os cookies ficam com o próprio browser.
  if (!kIsWeb) {
    final dir = await getApplicationSupportDirectory();
    final jar = PersistCookieJar(storage: FileStorage('${dir.path}/cookies'));

    _cookieJar = jar;
    api.interceptors.add(CookieManager(jar));
  }

  api.interceptors.add(
    InterceptorsWrapper(
      onError: (error, handler) {
        final path = error.requestOptions.path;

        if (error.response?.statusCode == 401 && !path.startsWith('login')) {
          onUnauthorized?.call();
        }

        handler.next(error);
      },
    ),
  );
}

Future<void> clearSession() async => _cookieJar?.deleteAll();
