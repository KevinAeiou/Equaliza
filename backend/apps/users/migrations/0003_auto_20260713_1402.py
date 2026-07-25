import os
from django.db import migrations
from django.contrib.auth import get_user_model


def criar_superusuario(apps, schema_editor):
    User = get_user_model()

    admin_email = os.getenv("ADMIN_EMAIL", "admin@equaliza.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "@Senha123")

    if not User.objects.filter(email=admin_email).exists():
        User.objects.create_superuser(email=admin_email, password=admin_password) # pyright: ignore[reportCallIssue]


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_current_family"),
    ]

    operations = [
        migrations.RunPython(criar_superusuario),
    ]
