"use client"

import { ChipGroup, FilterSection, FilterSheet, FormChipsField } from "@/src/components/filters"
import { useDashboardFilters } from "../hooks/useDashboardFilters"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { PeriodFilterFields } from "./PeriodFilterFields"

interface DashboardFiltersProps {
	filters: FormDashboardFilterSchemaType
	categoryGroups: ChipGroup[]
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormDashboardFilterSchemaType) => void
}

export const DashboardFilters = ({
	filters,
	categoryGroups,
	showFilter,
	onApply,
	setShowFilter,
}: DashboardFiltersProps) => {
	const {
		form,
		type,
		onSubmit,
		handleClear,
	} = useDashboardFilters({ filters, showFilter, setShowFilter, onApply })

	const selected = form.watch("categories").length

	return (
		<FilterSheet
			open={showFilter}
			onOpenChange={setShowFilter}
			title="Filtros do dashboard"
			description="Escolha o período e as categorias que entram nos indicadores."
			formId="form-filters"
			onSubmit={form.handleSubmit(onSubmit)}
			onClear={handleClear}
		>
			<PeriodFilterFields
				control={form.control}
				typeName="type"
				periodName="period"
				type={type}
			/>

			<FilterSection
				title="Categorias"
				hint={selected ? `${selected} selecionada${selected > 1 ? "s" : ""}` : undefined}
			>
				<FormChipsField
					control={form.control}
					name="categories"
					groups={categoryGroups}
				/>
			</FilterSection>
		</FilterSheet>
	)
}
