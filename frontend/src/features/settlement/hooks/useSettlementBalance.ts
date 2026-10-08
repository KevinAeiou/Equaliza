import { useEffect, useState } from "react"
import { SettlementBalanceProps } from "@/src/types"
import { SettlementService } from "../services/settlement.service"

export const useSettlementBalance = (month: string, refresh: number) => {
	const [balance, setBalance] = useState<SettlementBalanceProps>()
	const [error, setError] = useState(false)

	useEffect(() => {
		let ignore = false

		SettlementService.getBalance(month)
			.then((data) => {
				if (ignore) return

				setBalance(data)
				setError(false)
			})
			.catch(() => {
				if (!ignore) setError(true)
			})

		return () => {
			ignore = true
		}
	}, [month, refresh])

	// Enquanto outro mês carrega, o saldo antigo não deve aparecer como se fosse do novo.
	const current = balance?.month === month ? balance : undefined

	return { balance: current, loading: !current && !error, error }
}
