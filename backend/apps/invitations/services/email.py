from django.conf import settings
from django.core.mail import send_mail


class InvitationEmailService:

    @staticmethod
    def send(invitation):

        link = invitation.invitation_link

        send_mail(
            subject="Você foi convidado para uma família no Equaliza",
            message=(
                f"Olá!\n\n"
                f"Você recebeu um convite para participar da família "
                f"'{invitation.family.name}'.\n\n"
                f"Utilize o link abaixo para criar sua conta:\n\n"
                f"{link}\n\n"
                f"Este convite expira em {invitation.expires_at:%d/%m/%Y às %H:%M}."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=False,
        )
