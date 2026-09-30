import { ArrowDownRight, ArrowUpRight, Repeat, Trash2 } from "lucide-react"
import { Controller } from "react-hook-form"
import { FormDialog } from "@/src/components/formDialog"
import { FormSegmentedField } from "@/src/components/filters/FormSegmentedField"
import { Button } from "@/src/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/src/components/ui/field"
import { Switch } from "@/src/components/ui/switch"
import { FormCurrencyField } from "../../finance/components/FormCurrencyField"
import { FormDateField } from "../../finance/components/FormDateField"
import { FormSelectField } from "../../finance/components/FormSelectField"
import { FormTextAreaField } from "../../finance/components/FormTextAreaField"
import { FINANCE_DESCRIPTION_MAX_LENGTH } from "../../finance/schemas/finance.schema"
import { RecurringProps } from "@/src/types"
import { useRecurringDialog } from "../hooks/useRecurringDialog"
import { describeSchedule, FREQUENCY_OPTIONS, formatShortDate } from "../utils"

interface RecurringDialogProps {
	recurringId?: number
	open: boolean
	setOpen: (value: boolean) => void
	setRecurringId: (value?: number) => void
	onSuccess: () => void
	onDelete: (recurring: RecurringProps) => void
}

const TYPE_OPTIONS = [
	{ label: "Despesa", value: "EXPENSE" },
	{ label: "Receita", value: "INCOME" },
]

export const RecurringDialog = ({
	recurringId,
	open,
	setOpen,
	setRecurringId,
	onSuccess,
	onDelete,
}: RecurringDialogProps) => {
	const {
		form,
		onSubmit,
		loading,
		handleClose,
		handleDelete,
		handleTypeChange,
		categoryOptions,
		isEditing,
		type,
		hasEnd,
		recurring,
	} = useRecurringDialog({ recurringId, setOpen, setRecurringId, onSuccess, onDelete })

	const expense = type === "EXPENSE"
	const tipo = expense ? "despesa" : "receita"

	return (
		<FormDialog
			open={open}
			onClose={handleClose}
			icon={isEditing ? Repeat : expense ? ArrowDownRight : ArrowUpRight}
			iconClassName={expense ? "bg-expense-soft text-expense-strong" : "bg-income-soft text-income"}
			title={isEditing ? "Editar recorrente" : `Nova ${tipo} recorrente`}
			description={
				isEditing
					? "Mudanças valem para os próximos lançamentos. Os já criados não são alterados."
					: "Defina uma vez. O lançamento é criado sozinho a cada ciclo."
			}
			formId="form-recurring"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel={isEditing ? "Salvar alterações" : `Criar ${tipo} recorrente`}
			loading={loading}
			size="lg"
		>
			<FieldGroup>
				{!isEditing && (
					<div
						role="radiogroup"
						aria-label="Tipo de lançamento"
						className="flex gap-1 rounded-lg bg-muted p-1"
					>
						{TYPE_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								role="radio"
								aria-checked={type === option.value}
								onClick={() => handleTypeChange(option.value)}
								className={
									"h-9 min-w-0 flex-1 rounded-md px-2 text-sm font-medium transition-colors " +
									(type === option.value
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground")
								}
							>
								{option.label}
							</button>
						))}
					</div>
				)}

				<FormCurrencyField
					control={form.control}
					name="amount"
					label="Valor"
					size="lg"
				/>

				{!isEditing && (
					<Field>
						<FieldLabel>Repetir</FieldLabel>
						<FormSegmentedField
							control={form.control}
							name="frequency"
							label="Frequência"
							options={FREQUENCY_OPTIONS}
						/>
					</Field>
				)}

				<div className="grid gap-4 sm:grid-cols-2">
					<FormDateField
						control={form.control}
						name="start_date"
						label={isEditing ? "Início" : "Primeira ocorrência"}
						disabled={isEditing}
					/>

					<FormSelectField
						control={form.control}
						name="category"
						label="Categoria"
						placeholder="Selecione"
						options={categoryOptions}
					/>
				</div>

				<Field>
					<FieldLabel>Término</FieldLabel>
					<Controller
						control={form.control}
						name="has_end"
						render={({ field }) => (
							<div
								role="radiogroup"
								aria-label="Término"
								className="flex gap-1 rounded-lg bg-muted p-1"
							>
								{[
									{ label: "Sem data final", value: false },
									{ label: "Até uma data", value: true },
								].map((option) => (
									<button
										key={option.label}
										type="button"
										role="radio"
										aria-checked={field.value === option.value}
										onClick={() => field.onChange(option.value)}
										className={
											"h-9 min-w-0 flex-1 rounded-md px-2 text-sm font-medium transition-colors " +
											(field.value === option.value
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground")
										}
									>
										{option.label}
									</button>
								))}
							</div>
						)}
					/>
				</Field>

				{hasEnd && (
					<FormDateField
						control={form.control}
						name="end_date"
						label="Data final"
					/>
				)}

				<FormTextAreaField
					control={form.control}
					name="description"
					label="Observação (opcional)"
					placeholder={expense ? "Ex.: Aluguel do apartamento" : "Ex.: Salário mensal"}
					maxLength={FINANCE_DESCRIPTION_MAX_LENGTH}
				/>

				{isEditing && (
					<Controller
						control={form.control}
						name="is_active"
						render={({ field }) => (
							<div className="flex items-center justify-between gap-4">
								<div className="flex flex-col">
									<span id="recurring-active-label" className="text-sm font-medium">
										Recorrente ativa
									</span>
									<span className="text-xs text-muted-foreground">
										Pause para interromper novos lançamentos.
									</span>
								</div>

								<Switch
									aria-labelledby="recurring-active-label"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</div>
						)}
					/>
				)}
			</FieldGroup>

			{isEditing && recurring && (
				<div className="flex flex-col gap-3">
					<p className="rounded-lg bg-muted p-3 text-sm">
						{recurring.is_active
							? `Próximo lançamento em ${formatShortDate(recurring.next_date)}, `
							: "Pausada. Quando ativa, será lançada "}
						{describeSchedule(recurring.frequency, recurring.start_date).toLowerCase()}.
					</p>

					<Button
						type="button"
						variant="outline"
						className="h-10 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={handleDelete}
					>
						<Trash2 className="size-4" />
						Excluir recorrente
					</Button>
				</div>
			)}
		</FormDialog>
	)
}
