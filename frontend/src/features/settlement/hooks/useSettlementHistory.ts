import { useEffect, useState } from "react"
import { SettlementProps, SettlementStatus } from "@/src/types"
import { SettlementService } from "../services/settlement.service"

export interface HistoryFilters {
	member?: number
	status?: SettlementStatus
}

export const useSettlementHistory = (
	month: string,
	filters: HistoryFilters,
	refresh: number,
) => {
	const [items, setItems] = useState<SettlementProps[]>()
	const [error, setError] = useState(false)

	useEffect(() => {
		let ignore = false

		SettlementService.list({ month, ...filters })
			.then((data) => {
				if (ignore) return

				setItems(data)
				setError(false)
			})
			.catch(() => {
				if (!ignore) setError(true)
			})

		return () => {
			ignore = true
		}
	}, [month, filters, refresh])

	return { items, loading: !items && !error, error }
}
