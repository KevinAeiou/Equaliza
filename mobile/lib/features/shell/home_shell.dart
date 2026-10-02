import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/session/app_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/basics.dart';
import '../../core/widgets/brand.dart';
import '../../core/widgets/error_view.dart';
import '../category/category_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../family/family_screen.dart';
import '../finance/finance_screen.dart';
import '../../models/finance.dart';
import '../invitation/invitation_screen.dart';
import '../member/member_screen.dart';
import 'app_menu.dart';
import 'app_section.dart';

/// Estrutura das telas autenticadas: barra superior com logo e menu lateral.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  late AppSection _section = AppScope.read(context).session.user.currentFamily == null
      ? AppSection.family
      : AppSection.dashboard;

  EntryType _financeType = EntryType.expense;

  void _navigate(AppSection section, {EntryType? entryType}) {
    _scaffoldKey.currentState?.closeEndDrawer();

    if (section == AppSection.finance && entryType != null) _financeType = entryType;

    if (section != _section) setState(() => _section = section);
  }

  Widget _body() {
    final user = AppScope.of(context).session.user;

    if (_section.adminOnly && !user.isAdmin) {
      return ErrorView.unauthorized(onHome: () => _navigate(AppSection.dashboard));
    }

    if (user.currentFamily == null && _section != AppSection.family) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
        children: [
          EmptyCard(
            title: 'Você ainda não participa de nenhuma família.',
            description: 'Crie uma família ou peça um convite para começar a organizar as finanças.',
            action: FilledButton(
              onPressed: () => _navigate(AppSection.family),
              child: const Text('Criar ou entrar em uma família'),
            ),
          ),
        ],
      );
    }

    // A chave da família recarrega a tela quando a família atual muda.
    final key = ValueKey('${_section.name}-${user.currentFamily?.id}-${_section == AppSection.finance ? _financeType.name : ''}');

    return switch (_section) {
      AppSection.dashboard => DashboardScreen(key: key),
      AppSection.finance => FinanceScreen(key: key, initialType: _financeType),
      AppSection.category => CategoryScreen(key: key),
      AppSection.member => MemberScreen(key: key),
      AppSection.invitation => InvitationScreen(key: key),
      AppSection.family => FamilyScreen(key: key),
    };
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return ShellScope(
      current: _section,
      navigate: _navigate,
      child: PopScope(
        // O botão voltar leva ao dashboard antes de sair do app.
        canPop: _section == AppSection.dashboard,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) _navigate(AppSection.dashboard);
        },
        child: Scaffold(
          key: _scaffoldKey,
          appBar: AppBar(
            toolbarHeight: 56,
            backgroundColor: colors.background,
            surfaceTintColor: Colors.transparent,
            automaticallyImplyLeading: false,
            titleSpacing: 16,
            title: GestureDetector(
              onTap: () => _navigate(AppSection.dashboard),
              child: Semantics(
                button: true,
                label: 'Equaliza, ir para o dashboard',
                child: const AppLogo(height: 29),
              ),
            ),
            shape: Border(bottom: BorderSide(color: colors.border)),
            actions: [
              Builder(
                builder: (context) => IconButton(
                  tooltip: 'Abrir menu',
                  onPressed: () => Scaffold.of(context).openEndDrawer(),
                  icon: const Icon(LucideIcons.menu, size: 20),
                ),
              ),
              const SizedBox(width: 6),
            ],
          ),
          endDrawer: AppMenu(current: _section, onNavigate: _navigate),
          body: _body(),
        ),
      ),
    );
  }
}
