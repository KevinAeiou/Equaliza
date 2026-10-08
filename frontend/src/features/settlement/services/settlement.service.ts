import { format } from "date-fns"
import { SettlementHistoryParams } from "@/src/types"
import { settlementApi } from "../infra/settlement"
import { FormPaymentSchemaType } from "../schemas/payment.schema"

export class SettlementService {
	static getBalance(month: string) {
		return settlementApi.getBalance(month)
	}

	static list(params: SettlementHistoryParams) {
		return settlementApi.list(params)
	}

	static create(month: string, data: FormPaymentSchemaType) {
		return settlementApi.create({
			receiver: data.receiver,
			amount: data.amount.toFixed(2),
			month,
			note: data.note?.trim() ?? "",
			paid_at: data.paid_at ? format(data.paid_at, "yyyy-MM-dd") : undefined,
		})
	}

	static cancel(id: number) {
		return settlementApi.cancel(id)
	}
}
