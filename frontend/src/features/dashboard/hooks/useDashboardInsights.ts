import { useCallback, useEffect, useState } from "react"
import { DashboardInsightsReportProps } from "@/src/types"
import { isApiError } from "@/src/lib/utils"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { ReportsService } from "../services/reports.services"

interface InsightsResult {
	key: string
	report?: DashboardInsightsReportProps
	error?: string
}

// Os insights não bloqueiam o restante do dashboard: têm carregamento e erro próprios.
export const useDashboardInsights = (
	filters: FormDashboardFilterSchemaType
) => {
	const [result, setResult] = useState<InsightsResult>()
	const [attempt, setAttempt] = useState(0)

	const key = [
		attempt,
		filters.type,
		filters.period.from.getTime(),
		filters.period.to.getTime(),
		filters.categories.join(","),
	].join("|")

	useEffect(() => {
		let cancelled = false

		ReportsService.getInsights(filters)
			.then((report) => {
				if (!cancelled) setResult({ key, report })
			})
			.catch((reason: unknown) => {
				if (cancelled) return

				setResult({
					key,
					error: isApiError(reason) ? reason.message : "Erro desconhecido ao buscar insights",
				})
			})

		return () => {
			cancelled = true
		}
		// A chave já resume os filtros; o objeto muda de identidade a cada aplicação.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key])

	const retry = useCallback(() => setAttempt((value) => value + 1), [])

	// Resultado de uma consulta anterior vale como "carregando".
	const current = result?.key === key ? result : undefined

	return {
		report: current?.report,
		error: current?.error,
		retry,
	}
}
