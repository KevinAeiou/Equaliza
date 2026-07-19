import os
from django.db import migrations
from apps.users.models import User


def criar_superusuario(apps, schema_editor):
    admin_email = os.getenv("ADMIN_EMAIL", "admin@equaliza.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "@Senha123")

    if not User.objects.filter(email=admin_email).exists():
        User.objects.create_superuser(email=admin_email, password=admin_password)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(criar_superusuario),
    ]
