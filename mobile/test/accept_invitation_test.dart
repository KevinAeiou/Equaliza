import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:equaliza/core/network/api_client.dart';
import 'package:equaliza/core/network/api_exception.dart';
import 'package:equaliza/core/session/app_scope.dart';
import 'package:equaliza/core/session/session_controller.dart';
import 'package:equaliza/core/theme/app_theme.dart';
import 'package:equaliza/core/theme/theme_controller.dart';
import 'package:equaliza/features/auth/accept_invitation_screen.dart';
import 'package:equaliza/features/auth/auth_service.dart';
import 'package:equaliza/features/auth/login_screen.dart';
import 'package:equaliza/models/member.dart';
import 'package:equaliza/models/user.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

const _token = '123e4567-e89b-12d3-a456-426614174000';

const _invitation = InvitationPreview(
  token: _token,
  email: 'ana@exemplo.com',
  familyName: 'Família Silva',
);

/// Responde às requisições sem rede e guarda as feitas.
class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.status, this.body);

  final int status;
  final Map<String, dynamic> body;
  final requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<List<int>>? requestStream, Future<void>? cancelFuture) async {
    requests.add(options);

    return ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class _FakeSession extends SessionController {
  _FakeSession({this.loggedIn = true, this.email = 'ana@exemplo.com', this.error});

  final bool loggedIn;
  final String email;
  final ApiException? error;
  final accepted = <String>[];

  @override
  SessionStatus get status => loggedIn ? SessionStatus.authenticated : SessionStatus.unauthenticated;

  @override
  User? get maybeUser => loggedIn
      ? User(
          id: 1,
          email: email,
          firstName: 'Ana',
          lastName: 'Silva',
          role: null,
          currentFamily: null,
          families: const [],
          avatarId: null,
        )
      : null;

  @override
  Future<String> acceptInvitation(String token) async {
    if (error != null) throw error!;
    accepted.add(token);

    return 'Família Silva';
  }
}

Future<void> _pump(WidgetTester tester, SessionController session, Widget screen) async {
  tester.view.physicalSize = const Size(390 * 3, 844 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(AppScope(
    session: session,
    theme: ThemeController(),
    child: MaterialApp(
      theme: AppTheme.light,
      home: const Scaffold(body: Text('raiz')),
    ),
  ));

  tester.state<NavigatorState>(find.byType(Navigator)).push(MaterialPageRoute(builder: (_) => screen));
  await tester.pumpAndSettle();
}

void main() {
  GoogleFonts.config.allowRuntimeFetching = false;

  group('AuthService.acceptInvitation', () {
    late HttpClientAdapter original;

    setUp(() => original = api.httpClientAdapter);
    tearDown(() => api.httpClientAdapter = original);

    test('envia o POST e devolve o nome da família', () async {
      final adapter = _FakeAdapter(200, {
        'data': {
          'family': {'id': 7, 'name': 'Família Silva'},
        },
      });
      api.httpClientAdapter = adapter;

      expect(await AuthService.acceptInvitation(_token), 'Família Silva');
      expect(adapter.requests.single.method, 'POST');
      expect(adapter.requests.single.path, 'invitations/$_token/accept/');
    });

    test('converte a recusa do backend em ApiException com a mensagem', () async {
      api.httpClientAdapter = _FakeAdapter(403, {'detail': 'Este convite foi enviado para outro e-mail.'});

      expect(
        AuthService.acceptInvitation(_token),
        throwsA(isA<ApiException>()
            .having((e) => e.message, 'message', 'Este convite foi enviado para outro e-mail.')
            .having((e) => e.status, 'status', 403)),
      );
    });
  });

  group('AcceptInvitationScreen', () {
    testWidgets('logado: aceita, volta à raiz e avisa', (tester) async {
      final session = _FakeSession();
      await _pump(tester, session, const AcceptInvitationScreen(invitation: _invitation));

      expect(find.text('Você foi convidado'), findsOneWidget);
      expect(find.textContaining('ana@exemplo.com'), findsOneWidget);

      await tester.tap(find.text('Entrar na família'));
      await tester.pumpAndSettle();

      expect(session.accepted, [_token]);
      expect(find.text('raiz'), findsOneWidget);
      expect(find.text('Você entrou na família Família Silva!'), findsOneWidget);
    });

    testWidgets('logado: mostra o erro do backend e permanece na tela', (tester) async {
      final session = _FakeSession(error: const ApiException('Você já faz parte desta família.'));
      await _pump(tester, session, const AcceptInvitationScreen(invitation: _invitation));

      await tester.tap(find.text('Entrar na família'));
      await tester.pumpAndSettle();

      expect(find.text('Você já faz parte desta família.'), findsOneWidget);
      expect(find.text('Você foi convidado'), findsOneWidget);
    });

    testWidgets('logado com outro e-mail: avisa qual conta deve ser usada', (tester) async {
      final session = _FakeSession(email: 'outra@exemplo.com');
      await _pump(tester, session, const AcceptInvitationScreen(invitation: _invitation));

      expect(find.textContaining('foi enviado para ana@exemplo.com'), findsOneWidget);
    });

    testWidgets('sem sessão: oferece login e cadastro, sem botão de aceitar', (tester) async {
      final session = _FakeSession(loggedIn: false);
      await _pump(tester, session, const AcceptInvitationScreen(invitation: _invitation));

      expect(find.text('Entrar na família'), findsNothing);
      expect(find.text('Criar conta'), findsOneWidget);

      await tester.tap(find.text('Já tenho conta'));
      await tester.pumpAndSettle();

      expect(find.byType(LoginScreen), findsOneWidget);
      expect(find.textContaining('aceitar o convite da família Família Silva'), findsOneWidget);
    });
  });
}
