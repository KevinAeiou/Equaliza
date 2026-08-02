import { DataTable } from "@/src/components/dataTable"
import { Card, CardContent } from "@/src/components/ui/card"
import { CategoryProps } from "@/src/types"
import { useCategoryCard } from "../hooks/useCategoryCard"
import { FormCategoryFilterSchemaType } from "../schemas/filter.schema"

interface CategoryCardProps {
	refresh: number
	setOpen: (value: boolean) => void
	setSelectedCategory: (category: CategoryProps) => void
	filters: FormCategoryFilterSchemaType
}

export const CategoryCard = ({
	refresh,
	setOpen,
	setSelectedCategory,
	filters,
}: CategoryCardProps) => {
	const {
		table,
		loading,
	} = useCategoryCard({ refresh, setOpen, setSelectedCategory, filters })

	return (
		<Card className="flex h-full flex-col overflow-hidden">
			<CardContent className="flex flex-1 min-h-0 flex-col px-6 pt-0">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhuma família encontrada."
				/>
			</CardContent>
		</Card>
	)
}