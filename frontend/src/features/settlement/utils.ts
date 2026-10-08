import { addMonths, format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"

const MONTH_FORMAT = "yyyy-MM"

export const currentMonth = () => format(new Date(), MONTH_FORMAT)

export const isValidMonth = (value?: string | null): value is string =>
	Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value))

export const shiftMonth = (month: string, step: 1 | -1) =>
	format(addMonths(parse(month, MONTH_FORMAT, new Date()), step), MONTH_FORMAT)

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

// "2026-11" → "Novembro de 2026"
export const monthLabel = (month: string) =>
	capitalize(format(parse(month, MONTH_FORMAT, new Date()), "MMMM 'de' yyyy", { locale: ptBR }))

// "2026-11" → "Nov/2026"
export const monthShortLabel = (month: string) =>
	capitalize(format(parse(month, MONTH_FORMAT, new Date()), "MMM/yyyy", { locale: ptBR }).replace(".", ""))
