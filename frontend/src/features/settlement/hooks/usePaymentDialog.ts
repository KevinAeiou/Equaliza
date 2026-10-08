import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { Resolver, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { applyApiValidationErrors, isApiError } from "@/src/lib/utils"
import { SettlementBalanceProps } from "@/src/types"
import {
	FormPaymentSchema,
	FormPaymentSchemaType,
	getDefaultValues,
} from "../schemas/payment.schema"
import { SettlementService } from "../services/settlement.service"
import { shiftMonth } from "../utils"

interface UsePaymentDialogProps {
	userId: number
	month: string
	balance?: SettlementBalanceProps
	initialReceiver?: number
	onClose: () => void
	onSuccess: () => void
}

export const usePaymentDialog = ({
	userId,
	month,
	balance,
	initialReceiver,
	onClose,
	onSuccess,
}: UsePaymentDialogProps) => {
	const [loading, setLoading] = useState(false)
	const [mode, setMode] = useState<"total" | "partial">("total")

	const me = balance?.members.find((member) => member.id === userId)
	const debt = Math.max(-Number(me?.balance ?? 0), 0)

	// Só quem tem crédito pode receber; o limite é o menor entre a minha dívida e o crédito dele.
	const receivers = useMemo(
		() =>
			(balance?.members ?? [])
				.filter((member) => member.id !== userId && Number(member.balance) > 0)
				.map((member) => ({
					label: member.name,
					value: member.id.toString(),
					max: Math.min(debt, Number(member.balance)),
				})),
		[balance, userId, debt],
	)

	const initial = receivers.find((item) => Number(item.value) === initialReceiver) ?? receivers[0]

	const form = useForm<FormPaymentSchemaType>({
		resolver: zodResolver(FormPaymentSchema) as Resolver<FormPaymentSchemaType>,
		defaultValues: {
			...getDefaultValues(),
			receiver: initial ? Number(initial.value) : undefined,
			amount: initial?.max ?? 0,
		},
	})

	const receiverId = useWatch({ control: form.control, name: "receiver" })
	const amount = Number(useWatch({ control: form.control, name: "amount" }) ?? 0)
	const max = receivers.find((item) => Number(item.value) === Number(receiverId))?.max ?? 0
	const remaining = Math.max(debt - amount, 0)

	const applyMode = (next: "total" | "partial") => {
		setMode(next)
		form.setValue("amount", next === "total" ? max : 0, { shouldValidate: true })
	}

	// No modo "Total", trocar o recebedor atualiza o valor para o novo limite.
	useEffect(() => {
		if (mode === "total") {
			form.setValue("amount", max, { shouldValidate: true })
		}
	}, [mode, max, form])

	const onSubmit = async (data: FormPaymentSchemaType) => {
		if (data.amount > max + 0.001) {
			form.setError("amount", { type: "validate", message: "O valor excede o saldo a acertar." })

			return
		}

		setLoading(true)

		try {
			await SettlementService.create(month, data)

			toast.success("Pagamento registrado.")
			onClose()
			onSuccess()
		} catch (error: unknown) {
			if (!isApiError(error)) return

			if (applyApiValidationErrors(form, error)) return

			toast.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	return {
		form,
		onSubmit,
		loading,
		receivers,
		max,
		mode,
		applyMode,
		remaining,
		nextMonth: shiftMonth(month, 1),
	}
}
