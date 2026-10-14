import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ImportBatchProps } from "@/src/types"

export const formatPendingDate = (date: string) =>
	format(parseISO(date), "d MMM yyyy", { locale: ptBR })

export const batchLabel = (batch: ImportBatchProps) => {
	const kind = batch.source === "CARD_INVOICE" ? "Fatura" : "Extrato"
	const period = batch.period_start && batch.period_end
		? `${format(parseISO(batch.period_start), "dd/MM")} a ${format(parseISO(batch.period_end), "dd/MM")}`
		: "sem período"

	return `${kind} · ${period} · ${batch.pending_count} pendente(s)`
}
