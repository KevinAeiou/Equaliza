import calendar
import random
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.finance.enums import CategoryType
from apps.finance.models import Expense, FinancialCategory, Income
from apps.invitations.models import Invitation
from apps.users.enuns import Avatar
from apps.users.models import User

PASSWORD = "equaliza123"
FAMILY_NAME = "Família Souza"
MONTHS = 6

MEMBERS = [
    ("ana@equaliza.dev", "Ana", "Souza", FamilyRole.OWNER, Avatar.AVATAR_1),
    ("bruno@equaliza.dev", "Bruno", "Souza", FamilyRole.ADMIN, Avatar.AVATAR_2),
    ("carla@equaliza.dev", "Carla", "Souza", FamilyRole.MEMBER, Avatar.AVATAR_3),
]
WITHOUT_FAMILY = ("sem.familia@equaliza.dev", "Diego", "Lima", Avatar.AVATAR_4)

# (categoria, descrição, dia, valor mínimo, valor máximo, quem paga)
MONTHLY_INCOMES = [
    ("Salário", "Salário Ana", 5, 6800, 6800, "ana"),
    ("Salário", "Salário Bruno", 5, 4200, 4200, "bruno"),
    ("Freelance", "Projeto freelance", 18, 900, 1900, "carla"),
]
MONTHLY_EXPENSES = [
    ("Moradia", "Aluguel", 10, 2400, 2400, "ana"),
    ("Contas", "Energia elétrica", 12, 180, 320, "bruno"),
    ("Contas", "Água", 12, 70, 120, "bruno"),
    ("Contas", "Internet", 15, 119.9, 119.9, "carla"),
    ("Educação", "Curso de inglês", 8, 380, 380, "ana"),
    ("Saúde", "Plano de saúde", 20, 640, 640, "bruno"),
    ("Pets", "Ração e petshop", 22, 150, 260, "carla"),
]
# (categoria, descrições possíveis, ocorrências no mês, valor mínimo, valor máximo)
VARIABLE_EXPENSES = [
    ("Alimentação", ["Supermercado", "Feira", "Padaria", "Açougue"], 7, 60, 480),
    ("Transporte", ["Combustível", "Aplicativo de transporte", "Estacionamento"], 4, 25, 260),
    ("Lazer", ["Cinema", "Restaurante", "Passeio no parque"], 3, 40, 280),
    ("Compras", ["Roupas", "Utensílios de casa", "Presente"], 2, 60, 420),
    ("Saúde", ["Farmácia", "Consulta"], 1, 45, 260),
]


def add_months(month: date, months: int) -> date:
    index = month.year * 12 + month.month - 1 + months

    return date(index // 12, index % 12 + 1, 1)


class Command(BaseCommand):
    help = "Povoa o banco com uma família de demonstração e 6 meses de receitas e despesas."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Executa mesmo com DEBUG desativado.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options["force"]:
            raise CommandError("Use apenas em desenvolvimento (DEBUG=True) ou passe --force.")

        # Semente fixa: cada execução recria exatamente os mesmos dados.
        self.random = random.Random(42)

        with transaction.atomic():
            self.clear()
            users = self.create_users()
            family = self.create_family(users)
            categories = self.load_categories(family)
            incomes, expenses = self.create_entries(family, users, categories)
            invitations = self.create_invitations(family, users)

        self.stdout.write(self.style.SUCCESS(
            f"{FAMILY_NAME}: {len(users)} membros, {incomes} receitas, {expenses} despesas "
            f"e {invitations} convites."
        ))
        self.stdout.write(f"Senha de todos os usuários: {PASSWORD}")

        for email, *_ in MEMBERS:
            self.stdout.write(f"  {email}")

        self.stdout.write(f"  {WITHOUT_FAMILY[0]} (sem família)")

    def clear(self):
        emails = [email for email, *_ in MEMBERS] + [WITHOUT_FAMILY[0]]

        families = Family.objects.filter(
            memberships__user__email__in=emails,
            name=FAMILY_NAME,
        ).distinct()

        # Lançamentos protegem suas categorias, então saem antes da família (e da categoria dela).
        Income.objects.filter(family__in=families).delete()
        Expense.objects.filter(family__in=families).delete()
        Family.objects.filter(pk__in=families.values("pk")).delete()
        User.objects.filter(email__in=emails).delete()

    def create_users(self):
        users = {}

        for email, first_name, last_name, _role, avatar in MEMBERS:
            users[first_name.lower()] = User.objects.create_user(
                email=email,
                password=PASSWORD,
                first_name=first_name,
                last_name=last_name,
                avatar=avatar,
            )

        email, first_name, last_name, avatar = WITHOUT_FAMILY
        User.objects.create_user(
            email=email,
            password=PASSWORD,
            first_name=first_name,
            last_name=last_name,
            avatar=avatar,
        )

        return users

    def create_family(self, users):
        owner = users["ana"]
        family = Family.objects.create(name=FAMILY_NAME, created_by=owner, updated_by=owner)

        for email, first_name, _last_name, role, _avatar in MEMBERS:
            user = users[first_name.lower()]

            FamilyMember.objects.create(
                family=family,
                user=user,
                role=role,
                created_by=owner,
                updated_by=owner,
            )

            user.current_family = family
            user.save(update_fields=["current_family"])

        return family

    def load_categories(self, family):
        FinancialCategory.objects.create(
            name="Pets",
            type=CategoryType.EXPENSE,
            family=family,
        )

        return {
            (category.name, category.type): category
            for category in FinancialCategory.objects.for_family(family)
        }

    def create_entries(self, family, users, categories):
        today = timezone.localdate()
        first_month = add_months(today.replace(day=1), -(MONTHS - 1))
        incomes, expenses = [], []

        def entry(model, bucket, category_type, category, description, day, amount, user, month):
            last_day = calendar.monthrange(month.year, month.month)[1]
            entry_date = month.replace(day=min(day, last_day))

            if entry_date > today:
                return

            bucket.append(model(
                family=family,
                category=categories[(category, category_type)],
                description=description,
                date=entry_date,
                amount=Decimal(str(amount)).quantize(Decimal("0.01")),
                created_by=user,
                updated_by=user,
            ))

        for index in range(MONTHS):
            month = add_months(first_month, index)

            for category, description, day, low, high, who in MONTHLY_INCOMES:
                entry(Income, incomes, CategoryType.INCOME, category, description,
                      day, self.amount(low, high), users[who], month)

            for category, description, day, low, high, who in MONTHLY_EXPENSES:
                entry(Expense, expenses, CategoryType.EXPENSE, category, description,
                      day, self.amount(low, high), users[who], month)

            for category, descriptions, count, low, high in VARIABLE_EXPENSES:
                for _ in range(count):
                    entry(Expense, expenses, CategoryType.EXPENSE, category,
                          self.random.choice(descriptions), self.random.randint(1, 28),
                          self.amount(low, high), self.random.choice(list(users.values())), month)

        Income.objects.bulk_create(incomes)
        Expense.objects.bulk_create(expenses)

        return len(incomes), len(expenses)

    def create_invitations(self, family, users):
        now = timezone.now()
        owner = users["ana"]

        # (e-mail, criado há N dias, aceito há N dias ou None). Convites valem 7 dias.
        invitations = [
            ("joao.souza@example.com", 1, None),
            ("vovo.lucia@example.com", 5, None),
            ("carla@equaliza.dev", 20, 19),
            ("tio.marcos@example.com", 12, None),
        ]

        for email, created_days, accepted_days in invitations:
            created_at = now - timedelta(days=created_days)
            invitation = Invitation.objects.create(
                family=family,
                email=email,
                expires_at=created_at + timedelta(days=7),
                accepted_at=now - timedelta(days=accepted_days) if accepted_days else None,
                created_by=owner,
                updated_by=owner,
            )
            # created_at é preenchido automaticamente; ajusta para refletir a data simulada.
            Invitation.objects.filter(pk=invitation.pk).update(created_at=created_at)

        return len(invitations)

    def amount(self, low, high):
        if low == high:
            return low

        return round(self.random.uniform(low, high), 2)
