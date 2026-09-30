class DeleteRecurringTransactionService:

    @staticmethod
    def execute(recurring):

        recurring.delete()
