import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	differenceInCalendarDays,
	endOfDay,
	endOfMonth,
	endOfWeek,
	endOfYear,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
	subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { DashboardChartsProps } from "@/src/types"
import { FormDashboardFilterSchemaType, PeriodType } from "./schemas/filters.schema"

type Period = FormDashboardFilterSchemaType["period"]

export const TREND_MONTHS = 6

const capitalize = (value: string) =>
	value.charAt(0).toUpperCase() + value.slice(1)

export const shiftPeriod = (
	type: PeriodType,
	period: Period,
	step: 1 | -1,
): Period => {
	switch (type) {
		case PeriodType.DAY: {
			const day = addDays(period.from, step)

			return { from: startOfDay(day), to: endOfDay(day) }
		}

		case PeriodType.WEEK: {
			const week = addWeeks(period.from, step)

			return {
				from: startOfWeek(week, { weekStartsOn: 0 }),
				to: endOfWeek(week, { weekStartsOn: 0 }),
			}
		}

		case PeriodType.YEAR: {
			const year = addYears(period.from, step)

			return { from: startOfYear(year), to: endOfYear(year) }
		}

		case PeriodType.PERIOD: {
			const days = (differenceInCalendarDays(period.to, period.from) + 1) * step

			return {
				from: startOfDay(addDays(period.from, days)),
				to: endOfDay(addDays(period.to, days)),
			}
		}

		default: {
			const month = addMonths(period.from, step)

			return { from: startOfMonth(month), to: endOfMonth(month) }
		}
	}
}

export const formatPeriodLabel = (
	type: PeriodType,
	period: Period,
) => {
	switch (type) {
		case PeriodType.DAY:
			return format(period.from, "d 'de' MMMM 'de' yyyy", { locale: ptBR })

		case PeriodType.WEEK:
		case PeriodType.PERIOD:
			return `${format(period.from, "dd/MM/yy")} – ${format(period.to, "dd/MM/yy")}`

		case PeriodType.YEAR:
			return format(period.from, "yyyy")

		default:
			return capitalize(format(period.from, "MMMM 'de' yyyy", { locale: ptBR }))
	}
}

export const getTrendPeriod = (period: Period): Period => ({
	from: startOfMonth(subMonths(period.to, TREND_MONTHS - 1)),
	to: endOfMonth(period.to),
})

export interface TrendPoint {
	period: string
	label: string
	income: number
	expense: number
}

// Preenche os meses sem lançamentos para que o gráfico sempre mostre a mesma janela.
export const buildTrend = (
	period: Period,
	data: DashboardChartsProps["income_vs_expense"] = [],
): TrendPoint[] => {
	const byPeriod = new Map(data.map((item) => [item.period, item]))

	return Array.from({ length: TREND_MONTHS }, (_, index) => {
		const month = subMonths(period.to, TREND_MONTHS - 1 - index)
		const key = format(month, "yyyy-MM")
		const item = byPeriod.get(key)

		return {
			period: key,
			label: capitalize(format(month, "MMM", { locale: ptBR }).replace(".", "")),
			income: Number(item?.income ?? 0),
			expense: Number(item?.expense ?? 0),
		}
	})
}

export const getInitials = (name: string) =>
	name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("")

export const getFirstName = (name: string) => name.split(" ")[0] ?? name

// Monograma de uma família sem o prefixo "Família" ("Família Souza" → "S").
export const getFamilyMonogram = (name: string) =>
	getInitials(name.replace(/^fam[ií]lia\s+/i, "")).slice(0, 2) || "F"
