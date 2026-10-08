import { HandCoins } from "lucide-react"
import { FormDialog } from "@/src/components/formDialog"
import { Button } from "@/src/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/src/components/ui/field"
import { formatCurrency } from "@/src/lib/utils"
import { SettlementBalanceProps } from "@/src/types"
import { FormCurrencyField } from "../../finance/components/FormCurrencyField"
import { FormDateField } from "../../finance/components/FormDateField"
import { FormSelectField } from "../../finance/components/FormSelectField"
import { FormTextAreaField } from "../../finance/components/FormTextAreaField"
import { SETTLEMENT_NOTE_MAX_LENGTH } from "../schemas/payment.schema"
import { usePaymentDialog } from "../hooks/usePaymentDialog"
import { monthShortLabel } from "../utils"

interface PaymentDialogProps {
	userId: number
	month: string
	balance?: SettlementBalanceProps
	initialReceiver?: number
	onClose: () => void
	onSuccess: () => void
}

export const PaymentDialog = (props: PaymentDialogProps) => {
	const {
		form,
		onSubmit,
		loading,
		receivers,
		max,
		mode,
		applyMode,
		remaining,
		nextMonth,
	} = usePaymentDialog(props)

	return (
		<FormDialog
			open
			onClose={props.onClose}
			icon={HandCoins}
			iconClassName="bg-income-soft text-income"
			title="Registrar pagamento"
			description={`Acerto de ${monthShortLabel(props.month)}. O app só registra: o dinheiro não é movimentado.`}
			formId="form-settlement"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel="Registrar pagamento"
			loadingLabel="Registrando..."
			loading={loading}
			size="lg"
		>
			<FieldGroup>
				<FormSelectField
					control={form.control}
					name="receiver"
					label="Quem recebe"
					placeholder="Selecione"
					options={receivers}
				/>

				<Field>
					<FieldLabel>Quanto pagar</FieldLabel>

					<div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de pagamento">
						<Button
							type="button"
							variant={mode === "total" ? "default" : "outline"}
							aria-pressed={mode === "total"}
							onClick={() => applyMode("total")}
						>
							Total {max > 0 && `(${formatCurrency(max)})`}
						</Button>

						<Button
							type="button"
							variant={mode === "partial" ? "default" : "outline"}
							aria-pressed={mode === "partial"}
							onClick={() => applyMode("partial")}
						>
							Parcial
						</Button>
					</div>
				</Field>

				<FormCurrencyField
					control={form.control}
					name="amount"
					label="Valor"
					size="lg"
					max={max}
				/>

				{remaining > 0 && (
					<p className="text-sm text-muted-foreground">
						Restarão <span className="font-semibold text-foreground tabular-nums">{formatCurrency(remaining)}</span>,
						lançados em {monthShortLabel(nextMonth)}.
					</p>
				)}

				<FormDateField control={form.control} name="paid_at" label="Data do pagamento" />

				<FormTextAreaField
					control={form.control}
					name="note"
					label="Observação (opcional)"
					placeholder="Ex.: Pix de acerto"
					rows={2}
					maxLength={SETTLEMENT_NOTE_MAX_LENGTH}
				/>
			</FieldGroup>
		</FormDialog>
	)
}
