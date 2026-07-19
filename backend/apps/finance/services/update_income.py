class UpdateIncomeService:
    UPDATABLE_FIELDS = (
        "amount",
        "date",
        "description",
        "category",
    )

    @staticmethod
    def execute(*, income, data):
        for field in UpdateIncomeService.UPDATABLE_FIELDS:
            if field in data:
                setattr(income, field, data[field])

        income.save(
            update_fields=(
                *[
                    field
                    for field in UpdateIncomeService.UPDATABLE_FIELDS
                    if field in data
                ],
                "updated_by",
            )
        )

        return income
