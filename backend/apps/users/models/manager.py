from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        """
        Cria e retorna um usuário comum.
        """

        if not email:
            raise ValueError(_("O e-mail é obrigatório."))

        email = self.normalize_email(email)

        extra_fields.setdefault("is_active", True)

        extra_fields.setdefault("is_staff", False)

        extra_fields.setdefault("is_superuser", False)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields,
    ):
        """
        Cria e retorna um superusuário.
        """

        extra_fields.setdefault("first_name", "Administrador")
        extra_fields.setdefault("last_name", "Sauro")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser deve possuir is_staff=True."))

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser deve possuir is_superuser=True."))

        return self.create_user(email, password, **extra_fields)
