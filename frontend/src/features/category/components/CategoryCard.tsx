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
		<Card className="flex h-full flex-1 flex-col overflow-hidden">
			<CardContent>
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhuma família encontrada."
				/>
			</CardContent>
		</Card>
	)
}