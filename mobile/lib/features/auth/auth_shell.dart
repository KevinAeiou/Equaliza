import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/brand.dart';

/// Moldura das telas públicas: logo no topo e conteúdo centralizado.
class AuthShell extends StatelessWidget {
  const AuthShell({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: context.colors.background,
        body: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) => SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 40),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - 80),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 384),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Align(alignment: Alignment.centerLeft, child: AppLogo(height: 40)),
                        for (final child in children) ...[const SizedBox(height: 32), child],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
}

class AuthHeader extends StatelessWidget {
  const AuthHeader({super.key, required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 24, height: 1.33, fontWeight: FontWeight.w600, letterSpacing: -0.5),
          ),
          const SizedBox(height: 8),
          Text(description, style: TextStyle(fontSize: 14, height: 1.43, color: context.colors.mutedForeground)),
        ],
      );
}

/// "Ainda não tem uma conta? Criar conta".
class AuthSwitchLink extends StatelessWidget {
  const AuthSwitchLink({super.key, required this.question, required this.action, required this.onTap});

  final String question;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(question, style: TextStyle(fontSize: 14, color: context.colors.mutedForeground)),
          TextButton(
            onPressed: onTap,
            style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4)),
            child: Text(action),
          ),
        ],
      );
}
