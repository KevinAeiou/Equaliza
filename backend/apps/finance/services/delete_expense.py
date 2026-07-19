class DeleteExpenseService:

    @staticmethod
    def execute(expense):

        expense.delete()
