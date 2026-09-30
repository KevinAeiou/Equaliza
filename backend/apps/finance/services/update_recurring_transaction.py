class UpdateRecurringTransactionService:
    UPDATABLE_FIELDS = (
        "amount",
        "description",
        "category",
        "end_date",
        "is_active",
    )

    @staticmethod
    def execute(*, recurring, data):
        for field in UpdateRecurringTransactionService.UPDATABLE_FIELDS:
            if field in data:
                setattr(recurring, field, data[field])

        recurring.save(
            update_fields=(
                *[
                    field
                    for field in UpdateRecurringTransactionService.UPDATABLE_FIELDS
                    if field in data
                ],
                "updated_by",
            )
        )

        return recurring
