import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RecurrenceFrequency, SelectOption } from "@/src/types"

export const FREQUENCY_OPTIONS: SelectOption<RecurrenceFrequency>[] = [
	{ label: "Semanal", value: "WEEKLY" },
	{ label: "Mensal", value: "MONTHLY" },
	{ label: "Anual", value: "YEARLY" },
]

export const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
	WEEKLY: "Semanal",
	MONTHLY: "Mensal",
	YEARLY: "Anual",
}

export const formatShortDate = (date: string) =>
	format(parseISO(date), "d MMM yyyy", { locale: ptBR })

// Ex.: "Mensal, dia 10", "Semanal, segunda", "Anual, 18 nov".
export const describeSchedule = (frequency: RecurrenceFrequency, startDate: string) => {
	const date = parseISO(startDate)

	if (frequency === "WEEKLY") {
		return `Semanal, ${format(date, "EEEE", { locale: ptBR }).replace("-feira", "")}`
	}

	if (frequency === "MONTHLY") {
		return `Mensal, dia ${format(date, "d")}`
	}

	return `Anual, ${format(date, "d MMM", { locale: ptBR })}`
}
