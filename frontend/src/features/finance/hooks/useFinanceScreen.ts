import { FinanceEntryType } from "@/src/types"
import { useState } from "react"


export const useFinanceScreen = () => {
	const [open, setOpen] = useState<boolean>(false)
	const [financeId, setFinanceId] = useState<number | undefined>(undefined)
	const [type, setType] = useState<FinanceEntryType>("EXPENSE")
	const [refresh, setRefresh] = useState<number>(0)

	return {
		type, setType,
		open, setOpen,
		refresh, setRefresh,
		financeId, setFinanceId,
	}
}