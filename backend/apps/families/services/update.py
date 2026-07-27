class UpdateFamilyService:

    @staticmethod
    def execute(*, family, name, user):
        family.name = name
        family.updated_by = user
        family.save(
            update_fields=[
                "name",
                "updated_by",
                "updated_at",
            ]
        )

        return family
