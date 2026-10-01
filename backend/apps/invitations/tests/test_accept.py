from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.families.enums import FamilyRole
from apps.families.models import Family, FamilyMember
from apps.invitations.models import Invitation
from apps.users.models import User


class AcceptInvitationTests(APITestCase):
    def setUp(self):
        self.family = Family.objects.create(name="Família A")
        self.owner = User.objects.create_user(email="dono@example.com", password="x")
        FamilyMember.objects.create(
            family=self.family, user=self.owner, role=FamilyRole.OWNER
        )
        self.owner.current_family = self.family
        self.owner.save(update_fields=["current_family"])

        self.other_family = Family.objects.create(name="Família B")
        self.user = User.objects.create_user(email="ana@example.com", password="x")
        FamilyMember.objects.create(
            family=self.other_family, user=self.user, role=FamilyRole.OWNER
        )
        self.user.current_family = self.other_family
        self.user.save(update_fields=["current_family"])

    def invite(self, email="ana@example.com", **kwargs):
        return Invitation.objects.create(
            family=self.family,
            email=email,
            expires_at=kwargs.pop("expires_at", timezone.now() + timedelta(days=1)),
            **kwargs,
        )

    def url(self, invitation):
        return f"/api/invitations/{invitation.token}/accept/"

    def test_existing_user_joins_family(self):
        invitation = self.invite()
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url(invitation))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            FamilyMember.objects.filter(family=self.family, user=self.user).exists()
        )
        self.assertTrue(
            FamilyMember.objects.filter(family=self.other_family, user=self.user).exists()
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_family, self.family)
        invitation.refresh_from_db()
        self.assertTrue(invitation.is_used)

    def test_user_without_family_joins(self):
        loner = User.objects.create_user(email="solo@example.com", password="x")
        invitation = self.invite(email="solo@example.com")
        self.client.force_authenticate(loner)

        response = self.client.post(self.url(invitation))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        loner.refresh_from_db()
        self.assertEqual(loner.current_family, self.family)

    def test_requires_authentication(self):
        response = self.client.post(self.url(self.invite()))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_other_email(self):
        invitation = self.invite(email="outra@example.com")
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url(invitation))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejects_used_invitation(self):
        invitation = self.invite()
        self.client.force_authenticate(self.user)
        self.client.post(self.url(invitation))
        self.user.current_family = self.other_family
        self.user.save(update_fields=["current_family"])

        response = self.client.post(self.url(invitation))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_expired_invitation(self):
        invitation = self.invite(expires_at=timezone.now() - timedelta(hours=1))
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url(invitation))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_already_member(self):
        FamilyMember.objects.create(family=self.family, user=self.user)
        invitation = self.invite()
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url(invitation))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_invite_existing_user(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post("/api/invitations/", {"email": "ana@example.com"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_invite_current_member(self):
        FamilyMember.objects.create(family=self.family, user=self.user)
        self.client.force_authenticate(self.owner)

        response = self.client.post("/api/invitations/", {"email": "ana@example.com"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
