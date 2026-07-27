import { FinanceEntryType } from "@/src/types"
import { Button } from "@/src/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/src/components/ui/dialog"
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
	const tipo = type === "EXPENSE" ? "despesa" : "renda"

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) {
					handleClose()
				}
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<form
					id="form-finance"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<DialogHeader>
						<DialogTitle>
							{isEditing
								? `Editar ${tipo}`
								: `Nova ${tipo}`}
						</DialogTitle>

						<DialogDescription>
							Preencha as informações da movimentação
							financeira.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						<FormCurrencyField
							control={form.control}
							name="amount"
							label="Valor"
						/>

						<FormDateField
							control={form.control}
							name="date"
							label="Data"
						/>

						<FormSelectField
							control={form.control}
							name="category"
							label="Categoria"
							placeholder="Selecione uma categoria"
							options={categoryOptions}
						/>

						<FormTextAreaField
							control={form.control}
							name="description"
							label="Observação"
							placeholder="Digite uma descrição..."
							maxLength={FINANCE_DESCRIPTION_MAX_LENGTH}
						/>

					</FieldGroup>

					{isEditing && finance && (
						<div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
							<div className="flex justify-between gap-4">
								<span className="font-medium text-muted-foreground">
									Criado em
								</span>

								<span className="font-medium text-muted-foreground">
									{finance.created_at && formatDate(finance.created_at)}
								</span>
							</div>

							<div className="flex justify-between gap-4">
								<span className="font-medium text-muted-foreground">
									Última atualização
								</span>

								<span className="font-medium text-muted-foreground">
									{finance.updated_at && formatDate(finance.updated_at)}
								</span>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleClose()}
						>
							Cancelar
						</Button>

						<Button
							type="submit"
							form="form-finance"
							disabled={loading}
						>
							{loading
								? "Salvando..."
								: isEditing
									? "Salvar alterações"
									: "Cadastrar"
							}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}