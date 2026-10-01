from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

User = get_user_model()


class PasswordResetRequestService:
    """
    Envia o e-mail de recuperação de senha. Não revela se o e-mail existe.
    """

    def execute(self, email: str) -> None:
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user is None:
            return

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        hours = settings.PASSWORD_RESET_TIMEOUT // 3600

        send_mail(
            subject="Recuperação de senha do Equaliza",
            message=(
                f"Olá!\n\n"
                f"Recebemos um pedido para redefinir a senha da sua conta.\n\n"
                f"Utilize o link abaixo para criar uma nova senha:\n\n"
                f"{link}\n\n"
                f"Este link expira em {hours} hora(s). "
                f"Se você não fez este pedido, ignore este e-mail."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )


class PasswordResetConfirmService:
    """
    Valida uid/token e define a nova senha. O token deixa de valer após o uso,
    pois depende do hash da senha atual.
    """

    invalid_link = "Link de recuperação inválido ou expirado."

    def execute(self, uid: str, token: str, password: str) -> None:
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"detail": self.invalid_link})

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({"detail": self.invalid_link})

        try:
            validate_password(password, user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})

        user.set_password(password)
        user.save(update_fields=["password"])
