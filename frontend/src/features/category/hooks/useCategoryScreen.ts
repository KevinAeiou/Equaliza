import { CategoryProps } from "@/src/types"
import { useState } from "react"
import { FormCategoryFilterSchemaType, getDefaultValues } from "../schemas/filter.schema"


export const useCategoryScreen = () => {
	const [open, setOpen] = useState<boolean>(false)
	const [refresh, setRefresh] = useState<number>(0)
	const [selectedCategory, setSelectedCategory] = useState<CategoryProps | undefined>(undefined)
	const [showFilter, setShowFilter] = useState<boolean>(false)
	const [filters, setFilters] = useState<FormCategoryFilterSchemaType>(
		getDefaultValues()
	)

	return {
		open, setOpen,
		refresh, setRefresh,
		selectedCategory, setSelectedCategory,
		showFilter, setShowFilter,
		filters, setFilters,
	}
}