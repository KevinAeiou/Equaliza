class DeleteIncomeService:

    @staticmethod
    def execute(income):

        income.delete()