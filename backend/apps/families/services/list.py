from apps.families.models import Family


class ListFamilyService:

    @staticmethod
    def execute(user):
        return Family.objects.for_user(user)
