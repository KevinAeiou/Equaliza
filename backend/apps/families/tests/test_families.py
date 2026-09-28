from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.users.models import User


class FamilyListTests(APITestCase):
    def test_list_shows_role_and_active_members(self):
        user = User.objects.create_user(email="eu@example.com", password="senha-teste")
        other = User.objects.create_user(email="outro@example.com", password="senha-teste")
        inactive = User.objects.create_user(email="inativo@example.com", password="senha-teste")

        family = Family.objects.create(name="Família Teste")
        FamilyMember.objects.create(family=family, user=user, role=FamilyRole.ADMIN)
        FamilyMember.objects.create(family=family, user=other, role=FamilyRole.OWNER)
        FamilyMember.objects.create(family=family, user=inactive, role=FamilyRole.MEMBER, is_active=False)

        self.client.force_authenticate(user)
        response = self.client.get("/api/families/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["role"], "Administrador")
        self.assertTrue(response.data[0]["is_active_member"])
        self.assertEqual(response.data[0]["members_count"], 2)
