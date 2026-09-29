import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/app_colors.dart';
import '../utils/formatters.dart';

/// Logo completo; a versão branca é usada no tema escuro ou sobre a cor da marca ([white]).
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.height = 29, this.white = false});

  final double height;
  final bool white;

  @override
  Widget build(BuildContext context) {
    final dark = white || Theme.of(context).brightness == Brightness.dark;

    return SvgPicture.asset(
      dark ? 'assets/images/logo-white.svg' : 'assets/images/logo.svg',
      height: height,
      semanticsLabel: 'Equaliza',
    );
  }
}

/// Símbolo da marca desenhado em código; no 404 a balança aparece desequilibrada.
class BrandGlyph extends StatelessWidget {
  const BrandGlyph({super.key, this.tilted = false, this.size = 64, this.color});

  final bool tilted;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) => CustomPaint(
        size: Size(size, size * 41 / 50),
        painter: _GlyphPainter(color ?? context.colors.brand, tilted),
      );
}

class _GlyphPainter extends CustomPainter {
  _GlyphPainter(this.color, this.tilted);

  final Color color;
  final bool tilted;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;

    // Coordenadas do viewBox "7 12 50 41" do SVG original.
    canvas
      ..scale(size.width / 50)
      ..translate(-7, -12)
      ..save();

    if (tilted) {
      canvas
        ..translate(32, 33.5)
        ..rotate(-14 * 3.1415926 / 180)
        ..translate(-32, -33.5);
    }

    canvas
      ..drawCircle(const Offset(20, 21), 7, paint)
      ..drawCircle(const Offset(44, 21), 7, paint)
      ..drawRRect(
        RRect.fromRectAndRadius(const Rect.fromLTWH(9, 31, 46, 5), const Radius.circular(2.5)),
        paint,
      )
      ..restore();

    final triangle = Path()
      ..moveTo(32, 40.5)
      ..lineTo(38.5, 49)
      ..lineTo(25.5, 49)
      ..close();

    canvas.drawPath(
      triangle,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeJoin = StrokeJoin.round,
    );
    canvas.drawPath(triangle, paint);
  }

  @override
  bool shouldRepaint(_GlyphPainter old) => old.color != color || old.tilted != tilted;
}

const avatarIds = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
];

/// Avatar com a imagem escolhida pelo usuário, ou as iniciais quando não há.
class UserAvatar extends StatelessWidget {
  const UserAvatar({
    super.key,
    required this.name,
    this.avatarId,
    this.size = 40,
    this.dimmed = false,
  });

  final String name;
  final String? avatarId;
  final double size;
  final bool dimmed;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final valid = avatarId != null && avatarIds.contains(avatarId);

    Widget avatar = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: colors.muted, shape: BoxShape.circle),
      clipBehavior: Clip.antiAlias,
      child: valid
          ? Image.asset('assets/avatars/$avatarId.jpg', width: size, height: size, fit: BoxFit.cover)
          : Text(
              getInitials(name),
              style: TextStyle(fontSize: size * 0.3, fontWeight: FontWeight.w600),
            ),
    );

    if (dimmed) {
      avatar = Opacity(
        opacity: 0.5,
        child: ColorFiltered(
          colorFilter: const ColorFilter.matrix([
            0.2126, 0.7152, 0.0722, 0, 0, //
            0.2126, 0.7152, 0.0722, 0, 0,
            0.2126, 0.7152, 0.0722, 0, 0,
            0, 0, 0, 1, 0,
          ]),
          child: avatar,
        ),
      );
    }

    return avatar;
  }
}

/// Monograma da família: verde na família atual, neutro nas demais.
class FamilyMonogram extends StatelessWidget {
  const FamilyMonogram({super.key, required this.name, this.current = false, this.size = 28});

  final String name;
  final bool current;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: current ? colors.brand : colors.muted,
        borderRadius: BorderRadius.circular(size > 32 ? 14 : 8),
      ),
      child: Text(
        getFamilyMonogram(name),
        style: TextStyle(
          color: current ? Colors.white : colors.foreground,
          fontSize: size * 0.38,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
