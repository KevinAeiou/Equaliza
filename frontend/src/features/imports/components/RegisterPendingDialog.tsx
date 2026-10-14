import { ArrowDownRight } from "lucide-react"
import { FormDialog } from "@/src/components/formDialog"
import { FieldGroup } from "@/src/components/ui/field"
import { PendingProps } from "@/src/types"
import { FormCurrencyField } from "../../finance/components/FormCurrencyField"
import { FormDateField } from "../../finance/components/FormDateField"
import { FormSelectField } from "../../finance/components/FormSelectField"
import { FormTextAreaField } from "../../finance/components/FormTextAreaField"
import { FINANCE_DESCRIPTION_MAX_LENGTH } from "../../finance/schemas/finance.schema"
import { useRegisterPendingDialog } from "../hooks/useRegisterPendingDialog"

interface RegisterPendingDialogProps {
	pending?: PendingProps
	ids?: number[]
	open: boolean
	onClose: () => void
	onSuccess: () => void
}

export const RegisterPendingDialog = ({ pending, ids, open, onClose, onSuccess }: RegisterPendingDialogProps) => {
	const { form, bulk, loading, onSubmit, categoryOptions, familyOptions } = useRegisterPendingDialog({
		pending,
		ids,
		onClose,
		onSuccess,
	})

	return (
		<FormDialog
			open={open}
			onClose={onClose}
			icon={ArrowDownRight}
			iconClassName="bg-expense-soft text-expense-strong"
			title={bulk ? `Registrar ${ids?.length ?? 0} despesas` : "Registrar como despesa"}
			description={
				bulk
					? "Todas as selecionadas usam a mesma família e categoria. Cada despesa pode ser editada depois."
					: "Confira os dados do extrato antes de registrar."
			}
			formId="form-register-pending"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel={bulk ? "Registrar despesas" : "Registrar despesa"}
			loading={loading}
			size="lg"
		>
			<FieldGroup>
				{!bulk && (
					<FormCurrencyField control={form.control} name="amount" label="Valor" size="lg" />
				)}

				<div className="grid gap-4 sm:grid-cols-2">
					{!bulk && <FormDateField control={form.control} name="date" label="Data" />}

					<FormSelectField
						control={form.control}
						name="category"
						label="Categoria"
						placeholder="Selecione"
						options={categoryOptions}
					/>

					{familyOptions.length > 1 && (
						<FormSelectField
							control={form.control}
							name="family"
							label="Família"
							options={familyOptions}
						/>
					)}
				</div>

				{!bulk && (
					<FormTextAreaField
						control={form.control}
						name="description"
						label="Descrição (opcional)"
						maxLength={FINANCE_DESCRIPTION_MAX_LENGTH}
					/>
				)}
			</FieldGroup>

			<p className="text-xs text-muted-foreground">
				Os membros da família verão o valor, a data e a descrição.
				{familyOptions.length > 1 && " Categorias personalizadas só valem na família ativa."}
			</p>
		</FormDialog>
	)
}
