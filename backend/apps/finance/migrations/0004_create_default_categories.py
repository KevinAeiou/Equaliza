from django.db import migrations

from apps.finance.enums import CategoryType


def create_default_categories(apps, schema_editor):
    FinancialCategory = apps.get_model(
        "finance",
        "FinancialCategory",
    )

    categories = [
        ("Alimentação", CategoryType.EXPENSE),
        ("Moradia", CategoryType.EXPENSE),
        ("Transporte", CategoryType.EXPENSE),
        ("Saúde", CategoryType.EXPENSE),
        ("Educação", CategoryType.EXPENSE),
        ("Lazer", CategoryType.EXPENSE),
        ("Contas", CategoryType.EXPENSE),
        ("Compras", CategoryType.EXPENSE),
        ("Salário", CategoryType.INCOME),
        ("Freelance", CategoryType.INCOME),
        ("Investimentos", CategoryType.INCOME),
        ("Outras Receitas", CategoryType.INCOME),
    ]

    for name, category_type in categories:
        FinancialCategory.objects.get_or_create(
            family=None,
            name=name,
            type=category_type,
        )


def delete_default_categories(apps, schema_editor):
    FinancialCategory = apps.get_model(
        "finance",
        "FinancialCategory",
    )

    FinancialCategory.objects.filter(
        family__isnull=True,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0003_alter_financialcategory_table"),
    ]

    operations = [
        migrations.RunPython(
            create_default_categories,
            delete_default_categories,
        ),
    ]
