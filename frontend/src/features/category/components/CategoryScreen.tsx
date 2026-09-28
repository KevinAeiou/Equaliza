import { Plus, X } from "lucide-react"
import { FilterButton } from "@/src/components/filters"
import { HeaderScreen } from "@/src/components/headerScreen"
import { useAuth } from "@/src/components/providers/AuthProvider"
import { Button } from "@/src/components/ui/button"
import { UserRole } from "@/src/types"
import { countCategoryFilters } from "../hooks/useCategoryFilters"
import { useCategoryScreen } from "../hooks/useCategoryScreen"
import { getDefaultValues } from "../schemas/filter.schema"
import { CategoryCard } from "./CategoryCard"
import { CategoryDialog } from "./CategoryDialog"
import { CategoryFilters } from "./CategoryFilters"

const TYPE_LABELS = { EXPENSE: "Despesas", INCOME: "Receitas" } as const

export const CategoryScreen = () => {
	const {
		open, setOpen,
		refresh, setRefresh,
		selectedCategory, setSelectedCategory,
		showFilter, setShowFilter,
		filters, setFilters,
	} = useCategoryScreen()

	const { user } = useAuth()
	const canManage = [UserRole.OWNER, UserRole.ADMIN].includes(user.role)

	const chips = [
		filters.name.trim() && {
			label: `Nome: “${filters.name.trim()}”`,
			remove: () => setFilters({ ...filters, name: "" }),
		},
		filters.type && {
			label: `Tipo: ${TYPE_LABELS[filters.type]}`,
			remove: () => setFilters({ ...filters, type: "" }),
		},
	].filter((chip) => !!chip)

	return (
		<section className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Categorias"
					subtitle="Organize as categorias usadas nas despesas e receitas da família."
				/>

				<div className="flex gap-2">
					<FilterButton
						activeCount={countCategoryFilters(filters)}
						onClick={() => setShowFilter((prev) => !prev)}
						compact={canManage}
						className={canManage ? undefined : "w-full sm:w-auto"}
					/>

					{canManage && (
						<Button
							onClick={() => setOpen(true)}
							className="h-10 flex-1 gap-2 sm:flex-none"
						>
							<Plus className="size-4" />
							Nova categoria
						</Button>
					)}
				</div>
			</div>

			{chips.length > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					{chips.map((chip) => (
						<button
							key={chip.label}
							type="button"
							onClick={chip.remove}
							aria-label={`Remover filtro ${chip.label}`}
							className="flex h-8 items-center gap-1.5 rounded-full border bg-card pr-2 pl-3 text-sm transition-colors hover:bg-muted"
						>
							{chip.label}
							<X className="size-3.5 text-muted-foreground" />
						</button>
					))}

					<button
						type="button"
						onClick={() => setFilters(getDefaultValues())}
						className="px-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
					>
						Limpar filtros
					</button>
				</div>
			)}

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
				filters={filters}
				showFilter={showFilter}
				setShowFilter={setShowFilter}
				onApply={setFilters}
			/>
		</section>
	)
}
