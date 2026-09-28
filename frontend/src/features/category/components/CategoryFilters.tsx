"use client"

import { FilterSection, FilterSheet, FormSegmentedField } from "@/src/components/filters"
import { FormTextField } from "../../auth/components/FormTextField"
import { useCategoryFilters } from "../hooks/useCategoryFilters"
import { FormCategoryFilterSchemaType } from "../schemas/filter.schema"

interface CategoryFiltersProps {
	filters: FormCategoryFilterSchemaType
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormCategoryFilterSchemaType) => void
}

export const CategoryFilters = ({
	filters,
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
		filters,
		showFilter,
		setShowFilter,
		onApply,
	})

	return (
		<FilterSheet
			open={showFilter}
			onOpenChange={setShowFilter}
			title="Filtrar categorias"
			description="Encontre categorias pelo nome ou pelo tipo."
			formId="form-category-filters"
			onSubmit={form.handleSubmit(onSubmit)}
			onClear={handleClear}
		>
			<FormTextField
				control={form.control}
				name="name"
				label="Nome"
				placeholder="Ex.: Mercado"
			/>

			<FilterSection title="Tipo">
				<FormSegmentedField
					control={form.control}
					name="type"
					label="Tipo de categoria"
					options={typeOptions}
				/>
			</FilterSection>
		</FilterSheet>
	)
}
