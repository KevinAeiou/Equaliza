from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.users.models import User


class FamilyMemberRulesTests(APITestCase):
    def setUp(self):
        self.family = Family.objects.create(name="Família Teste")
        self.owner, self.owner_membership = self.create_member("dono@example.com", FamilyRole.OWNER)
        self.admin, self.admin_membership = self.create_member("admin@example.com", FamilyRole.ADMIN)
        self.member, self.member_membership = self.create_member("membro@example.com", FamilyRole.MEMBER)

    def create_member(self, email, role):
        user = User.objects.create_user(email=email, password="senha-teste")
        membership = FamilyMember.objects.create(family=self.family, user=user, role=role)
        user.current_family = self.family
        user.save(update_fields=["current_family"])

        return user, membership

    def test_owner_cannot_be_deactivated(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(f"/api/families/members/{self.owner_membership.id}/status/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.owner_membership.refresh_from_db()
        self.assertTrue(self.owner_membership.is_active)

    def test_owner_cannot_be_removed(self):
        self.client.force_authenticate(self.admin)

        response = self.client.delete(f"/api/families/members/{self.owner_membership.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(FamilyMember.objects.filter(pk=self.owner_membership.pk).exists())

    def test_inactive_member_can_be_removed(self):
        self.member_membership.is_active = False
        self.member_membership.save(update_fields=["is_active"])
        self.client.force_authenticate(self.owner)

        response = self.client.delete(f"/api/families/members/{self.member_membership.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FamilyMember.objects.filter(pk=self.member_membership.pk).exists())
        self.member.refresh_from_db()
        self.assertIsNone(self.member.current_family)

    def test_admin_can_still_deactivate_member(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(f"/api/families/members/{self.member_membership.id}/status/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.member_membership.refresh_from_db()
        self.assertFalse(self.member_membership.is_active)
