import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { FinanceEntryType } from "@/src/types"
import { FormDialog } from "@/src/components/formDialog"
import { FieldGroup } from "@/src/components/ui/field"
import { useFinanceDialog } from "../hooks/useFinanceDialog"
import { FormCurrencyField } from "./FormCurrencyField"
import { FormDateField } from "./FormDateField"
import { FormSelectField } from "./FormSelectField"
import { FormTextAreaField } from "./FormTextAreaField"
import { FINANCE_DESCRIPTION_MAX_LENGTH } from "../schemas/finance.schema"
import { formatDate } from "@/src/lib/utils"

interface FinanceDialogProps {
	type: FinanceEntryType
	financeId?: number
	open: boolean
	setOpen: (value: boolean) => void
	setFinanceId: (value?: number) => void
	onSuccess: () => void
}

export const FinanceDialog = ({
	type,
	financeId,
	open,
	setOpen,
	setFinanceId,
	onSuccess,
}: FinanceDialogProps) => {
	const {
		form,
		onSubmit,
		loading,
		handleClose,
		categoryOptions,
		finance,
	} = useFinanceDialog({ type, financeId, setOpen, setFinanceId, onSuccess })

	const isEditing = financeId !== undefined
	const expense = type === "EXPENSE"
	const tipo = expense ? "despesa" : "receita"

	return (
		<FormDialog
			open={open}
			onClose={handleClose}
			icon={expense ? ArrowDownRight : ArrowUpRight}
			iconClassName={expense ? "bg-expense-soft text-expense-strong" : "bg-income-soft text-income"}
			title={isEditing ? `Editar ${tipo}` : `Nova ${tipo}`}
			description={
				expense
					? "Registre um gasto da família. Ele entra na divisão entre os membros."
					: "Registre um valor recebido. Ele define a cota de cada membro nas despesas."
			}
			formId="form-finance"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel={isEditing ? "Salvar alterações" : `Registrar ${tipo}`}
			loading={loading}
			size="lg"
		>
			<FieldGroup>
				<FormCurrencyField
					control={form.control}
					name="amount"
					label="Valor"
					size="lg"
				/>

				<div className="grid gap-4 sm:grid-cols-2">
					<FormDateField
						control={form.control}
						name="date"
						label="Data"
					/>

					<FormSelectField
						control={form.control}
						name="category"
						label="Categoria"
						placeholder="Selecione"
						options={categoryOptions}
					/>
				</div>

				<FormTextAreaField
					control={form.control}
					name="description"
					label="Observação (opcional)"
					placeholder={expense ? "Ex.: Compras do mês no mercado" : "Ex.: Salário de setembro"}
					maxLength={FINANCE_DESCRIPTION_MAX_LENGTH}
				/>
			</FieldGroup>

			{isEditing && finance && (
				<p className="text-xs text-muted-foreground">
					Criada em {finance.created_at && formatDate(finance.created_at)}
					{finance.updated_at && finance.updated_at !== finance.created_at && (
						<> · atualizada em {formatDate(finance.updated_at)}</>
					)}
				</p>
			)}
		</FormDialog>
	)
}
