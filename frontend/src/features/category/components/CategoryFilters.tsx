"use client"

import { Button } from "@/src/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/src/components/ui/sheet"
import { Separator } from "@/src/components/ui/separator"


import { FormCategoryFilterSchemaType } from "../schemas/filter.schema"
import { useCategoryFilters } from "../hooks/useCategoryFilters"
import { FormSelectField } from "../../finance/components/FormSelectField"
import { FormTextField } from "../../auth/components/FormTextField"

interface CategoryFiltersProps {
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormCategoryFilterSchemaType) => void
}

export const CategoryFilters = ({
	showFilter,
	setShowFilter,
	onApply,
}: CategoryFiltersProps) => {
	const {
		form,
		typeOptions,
		onSubmit,
		handleClear,
	} = useCategoryFilters({
		setShowFilter,
		onApply,
	})

	return (
		<Sheet
			open={showFilter}
			onOpenChange={setShowFilter}
		>
			<SheetContent className="w-full rounded-l-xl sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Filtros</SheetTitle>

					<SheetDescription>
						Filtre as categorias por nome e tipo.
					</SheetDescription>
				</SheetHeader>

				<form
					id="form-category-filters"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<div className="flex flex-col gap-4 px-4">
						<FormTextField
							control={form.control}
							name="name"
							label="Nome"
							placeholder="Digite o nome da categoria"
						/>

						<FormSelectField
							control={form.control}
							name="type"
							label="Tipo"
							placeholder="Todos"
							options={typeOptions}
						/>
					</div>
				</form>

				<SheetFooter className="gap-4">
					<Separator className="my-2" />

					<Button
						type="button"
						variant="outline"
						onClick={handleClear}
					>
						Limpar filtros
					</Button>

					<Button
						type="submit"
						form="form-category-filters"
						className="w-full"
					>
						Aplicar filtros
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}