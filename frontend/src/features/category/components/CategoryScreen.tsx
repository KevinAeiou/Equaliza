import { HeaderScreen } from "@/src/components/headerScreen"
import { Button } from "@/src/components/ui/button"
import { Plus, SlidersHorizontal } from "lucide-react"
import { useCategoryScreen } from "../hooks/useCategoryScreen"
import { CategoryCard } from "./CategoryCard"
import { CategoryDialog } from "./CategoryDialog"
import { CategoryFilters } from "./CategoryFilters"


export const CategoryScreen = () => {
	const {
		open, setOpen,
		refresh, setRefresh,
		selectedCategory, setSelectedCategory,
		showFilter, setShowFilter,
		filters, setFilters,
	} = useCategoryScreen()

	return (
		<section className="flex flex-col h-full gap-2">
			<HeaderScreen
				title="Categorias"
				subtitle="Acompanhe o resumo financeiro da sua família."
			>
				<Button
					variant="outline"
					className="gap-2 w-full sm:w-auto"
					onClick={() => setShowFilter((prev) => !prev)}
				>
					<SlidersHorizontal size={16} />
					Filtros
				</Button>
			</HeaderScreen>

			<div className="flex justify-end w-full">
				<Button
					onClick={() => setOpen(true)}
				>
					<Plus className="mr-2 h-4 w-4" />
					Nova categoria
				</Button>
			</div>

			<CategoryCard
				refresh={refresh}
				setOpen={setOpen}
				setSelectedCategory={setSelectedCategory}
				filters={filters}
			/>

			<CategoryDialog
				open={open}
				setOpen={setOpen}
				selectedCategory={selectedCategory}
				setSelectedCategory={setSelectedCategory}
				onSuccess={() => setRefresh((v) => v + 1)}
			/>

			<CategoryFilters
				showFilter={showFilter}
				setShowFilter={setShowFilter}
				onApply={setFilters}
			/>
		</section>
	)
}