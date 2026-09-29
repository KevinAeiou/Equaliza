import 'package:equaliza/core/theme/app_theme.dart';
import 'package:equaliza/features/auth/login_screen.dart';
import 'package:equaliza/features/auth/register_screen.dart';
import 'package:equaliza/models/member.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  GoogleFonts.config.allowRuntimeFetching = false;

  final screens = <String, Widget Function()>{
    'login': () => const LoginScreen(),
    'cadastro': () => const RegisterScreen(),
    'convite': () => const RegisterScreen(
          invitation: InvitationPreview(token: 't', email: 'voce@exemplo.com', familyName: 'Família Silva'),
        ),
  };

  for (final dark in [false, true]) {
    for (final entry in screens.entries) {
      testWidgets('${entry.key} ${dark ? 'escuro' : 'claro'} sem erros de layout', (tester) async {
        tester.view.physicalSize = const Size(390 * 3, 844 * 3);
        tester.view.devicePixelRatio = 3;
        addTearDown(tester.view.reset);

        // Empilha a tela sobre uma rota raiz, como no app (cadastro mostra o voltar).
        await tester.pumpWidget(MaterialApp(
          theme: dark ? AppTheme.dark : AppTheme.light,
          home: entry.key == 'login' ? entry.value() : const SizedBox(),
        ));
        if (entry.key != 'login') {
          tester.state<NavigatorState>(find.byType(Navigator)).push(MaterialPageRoute(builder: (_) => entry.value()));
        }
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
        expect(find.byType(Scaffold), findsWidgets);

        // Validação vazia também não pode estourar o layout.
        final submit = find.byType(FilledButton);
        await tester.ensureVisible(submit);
        await tester.tap(submit);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });
    }
  }
}
