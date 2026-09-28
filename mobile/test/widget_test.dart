import 'package:flutter_test/flutter_test.dart';

import 'package:equaliza/app.dart';

void main() {
  testWidgets('Exibe a tela inicial', (WidgetTester tester) async {
    await tester.pumpWidget(const EqualizaApp());

    expect(find.text('Bem-vindo ao Equaliza'), findsOneWidget);
  });
}
