import { FinanceEntryType } from "@/src/types"
import { useState } from "react"
import { FormFinanceFilterSchemaType, getDefaultValues } from "../schemas/filter.schema"


export const useFinanceScreen = () => {
	const [open, setOpen] = useState<boolean>(false)
	const [financeId, setFinanceId] = useState<number | undefined>(undefined)
	const [type, setType] = useState<FinanceEntryType>("EXPENSE")
	const [refresh, setRefresh] = useState<number>(0)
	const [showFilter, setShowFilter] = useState<boolean>(false)
	const [filters, setFilters] = useState<FormFinanceFilterSchemaType>(
		getDefaultValues()
	)

	const handleTypeChange = (value: FinanceEntryType) => {
		setType(value)
		setFilters((current) => ({
			...current,
			categories: [],
		}))
	}

	return {
		type,
		open, setOpen,
		refresh, setRefresh,
		financeId, setFinanceId,
		showFilter, setShowFilter,
		filters, setFilters,
		handleTypeChange,
	}
}