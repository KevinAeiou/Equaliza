"use client"

import { FilterSection, FilterSheet, FormChipsField } from "@/src/components/filters"
import { FinanceEntryType } from "@/src/types"
import { PeriodFilterFields } from "../../dashboard/components/PeriodFilterFields"
import { useFinanceFilters } from "../hooks/useFinanceFilters"
import { FormFinanceFilterSchemaType } from "../schemas/filter.schema"

interface FinanceFiltersProps {
	type: FinanceEntryType
	filters: FormFinanceFilterSchemaType
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormFinanceFilterSchemaType) => void
}

export const FinanceFilters = ({
	type,
	filters,
	showFilter,
	setShowFilter,
	onApply,
}: FinanceFiltersProps) => {
	const {
		form,
		periodType,
		onSubmit,
		categoryOptions,
		handleClear,
	} = useFinanceFilters({ filters, showFilter, setShowFilter, onApply, type })

	const selected = form.watch("categories").length
	const entries = type === "EXPENSE" ? "despesas" : "receitas"

	return (
		<FilterSheet
			open={showFilter}
			onOpenChange={setShowFilter}
			title={`Filtrar ${entries}`}
			description={`Escolha o período e as categorias das ${entries} exibidas.`}
			formId="form-finance-filters"
			onSubmit={form.handleSubmit(onSubmit)}
			onClear={handleClear}
		>
			<PeriodFilterFields
				control={form.control}
				typeName="type"
				periodName="period"
				type={periodType}
			/>

			<FilterSection
				title="Categorias"
				hint={selected ? `${selected} selecionada${selected > 1 ? "s" : ""}` : undefined}
			>
				<FormChipsField
					control={form.control}
					name="categories"
					groups={[{ options: categoryOptions }]}
					emptyMessage={`Nenhuma categoria de ${entries} cadastrada.`}
				/>
			</FilterSection>
		</FilterSheet>
	)
}
