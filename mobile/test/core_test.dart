import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:equaliza/core/network/api_exception.dart';
import 'package:equaliza/core/utils/formatters.dart';
import 'package:equaliza/core/utils/period.dart';
import 'package:equaliza/features/auth/auth_service.dart';
import 'package:equaliza/models/dashboard.dart';
import 'package:equaliza/models/member.dart';

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  group('formatters', () {
    test('formata moeda e sinal como no web', () {
      expect(formatCurrency(1234.5), 'R\$ 1.234,50');
      expect(formatSignedCurrency(-10), '−R\$ 10,00');
      expect(formatSignedCurrency(622.66), '+R\$ 622,66');
    });

    test('monograma ignora o prefixo "Família"', () {
      expect(getFamilyMonogram('Família Souza'), 'S');
      expect(getFamilyMonogram('Casa da Praia'), 'CD');
      expect(getInitials('Ana Souza'), 'AS');
    });

    test('máscara de moeda trata os dígitos como centavos', () {
      final formatter = CurrencyInputFormatter();
      final value = formatter.formatEditUpdate(
        TextEditingValue.empty,
        const TextEditingValue(text: '12345'),
      );

      expect(value.text, 'R\$ 123,45');
      expect(CurrencyInputFormatter.parse(value.text), 123.45);
    });
  });

  group('período', () {
    test('semana começa no domingo', () {
      final period = periodFor(PeriodType.week, DateTime(2026, 9, 30));

      expect(period.from, DateTime(2026, 9, 27));
      expect(period.to, DateTime(2026, 10, 3));
    });

    test('avança e volta meses', () {
      final september = periodFor(PeriodType.month, DateTime(2026, 9, 15));

      expect(shiftPeriod(PeriodType.month, september, 1).to, DateTime(2026, 10, 31));
      expect(shiftPeriod(PeriodType.month, september, -9).from, DateTime(2025, 12));
      expect(formatPeriodLabel(PeriodType.month, september), 'Setembro de 2026');
    });

    test('tendência preenche os 6 meses', () {
      final trend = buildTrend(
        periodFor(PeriodType.month, DateTime(2026, 9)),
        const [MonthTotals(period: '2026-09', income: 100, expense: 40)],
      );

      expect(trend, hasLength(6));
      expect(trend.first.label, 'Abr');
      expect(trend.last.income, 100);
      expect(trend.first.income, 0);
    });

    test('acertos zeram as diferenças', () {
      final settlements = buildSettlements(const [
        MemberContribution(member: 'Ana Souza', expected: 4516.73, paid: 3380, difference: -1136.73),
        MemberContribution(member: 'Bruno Souza', expected: 2789.74, paid: 3412.4, difference: 622.66),
        MemberContribution(member: 'Carla Souza', expected: 929.93, paid: 1444, difference: 514.07),
      ]);

      expect(settlements.map((item) => (item.from, item.to)), [
        ('Ana Souza', 'Bruno Souza'),
        ('Ana Souza', 'Carla Souza'),
      ]);
      expect(settlements.first.amount, closeTo(622.66, 0.001));
    });
  });

  group('API', () {
    test('usa o detail e depois a primeira mensagem de campo', () {
      DioException error(Object data) => DioException(
            requestOptions: RequestOptions(),
            response: Response(requestOptions: RequestOptions(), statusCode: 400, data: data),
          );

      expect(ApiException.from(error({'detail': 'Credenciais inválidas.'}), 'autenticar').message,
          'Credenciais inválidas.');

      final validation = ApiException.from(error({'email': ['E-mail já cadastrado.']}), 'cadastrar');

      expect(validation.message, 'E-mail já cadastrado.');
      expect(validation.fieldErrors['email'], 'E-mail já cadastrado.');
    });

    test('extrai o token do link do convite', () {
      const token = '3f2c1b9a-8d7e-4c6b-9a5f-1e2d3c4b5a69';

      expect(AuthService.extractToken('https://equaliza.app/register?token=$token'), token);
      expect(AuthService.extractToken('link inválido'), isNull);
    });

    test('lê o avatar do membro a partir do caminho do web', () {
      final member = Member.fromJson({
        'id': 1,
        'name': 'Bruno Souza',
        'email': 'bruno@equaliza.dev',
        'role': 'Administrador',
        'avatar': '/avatars/avatar-2.jpg',
        'joined_at': '2026-04-10T12:00:00Z',
        'is_active': true,
      });

      expect(member.avatarId, 'avatar-2');
    });
  });
}
