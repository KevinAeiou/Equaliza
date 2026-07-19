class UpdateExpenseService:
    UPDATABLE_FIELDS = (
        "amount",
        "date",
        "description",
        "category",
    )

    @staticmethod
    def execute(*, expense, data):
        for field in UpdateExpenseService.UPDATABLE_FIELDS:
            if field in data:
                setattr(expense, field, data[field])

        expense.save(
            update_fields=(
                *[
                    field
                    for field in UpdateExpenseService.UPDATABLE_FIELDS
                    if field in data
                ],
                "updated_by",
            )
        )

        return expense
