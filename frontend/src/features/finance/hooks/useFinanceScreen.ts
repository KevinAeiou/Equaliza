import { FinanceEntryType, SelectOption } from "@/src/types"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FormFinanceFilterSchemaType, getDefaultValues } from "../schemas/filter.schema"
import { FinanceService } from "../services/financial.service"
import { useDashboardCategories } from "../../dashboard/hooks/useDashboardCategories"


export const useFinanceScreen = () => {
	const [open, setOpen] = useState<boolean>(false)
	const [financeId, setFinanceId] = useState<number | undefined>(undefined)
	const searchParams = useSearchParams()
	const [type, setType] = useState<FinanceEntryType>(
		searchParams.get("type") === "INCOME" ? "INCOME" : "EXPENSE"
	)
	const [refresh, setRefresh] = useState<number>(0)
	const [showFilter, setShowFilter] = useState<boolean>(false)
	const [filters, setFilters] = useState<FormFinanceFilterSchemaType>(
		getDefaultValues()
	)

	// Nomes das categorias para as etiquetas de filtros ativos.
	const { categoryOptions } = useDashboardCategories()

	// Nomes dos membros para as etiquetas de filtros ativos.
	const [memberOptions, setMemberOptions] = useState<SelectOption<number>[]>([])

	useEffect(() => {
		FinanceService.listMembers()
			.then((members) =>
				setMemberOptions(members.map((member) => ({ label: member.name, value: member.id })))
			)
			.catch(() => setMemberOptions([]))
	}, [])

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
		categoryOptions,
		memberOptions,
	}
}