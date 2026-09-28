"use client"

import { X } from "lucide-react"
import { SelectOption } from "@/src/types"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

interface ActiveFiltersProps {
	filters: FormDashboardFilterSchemaType
	categoryOptions: SelectOption<number>[]
	onChange: (filters: FormDashboardFilterSchemaType) => void
}

export const ActiveFilters = ({
	filters,
	categoryOptions,
	onChange,
}: ActiveFiltersProps) => {
	if (!filters.categories.length) return null

	const labels = new Map(categoryOptions.map((option) => [option.value, option.label]))

	const remove = (id: number) =>
		onChange({
			...filters,
			categories: filters.categories.filter((category) => category !== id),
		})

	return (
		<div className="flex flex-wrap items-center gap-2">
			{filters.categories.map((id) => (
				<button
					key={id}
					type="button"
					onClick={() => remove(id)}
					aria-label={`Remover filtro ${labels.get(id) ?? ""}`}
					className="flex h-8 items-center gap-1.5 rounded-full border bg-card pr-2 pl-3 text-sm transition-colors hover:bg-muted"
				>
					{labels.get(id) ?? "Categoria"}
					<X className="size-3.5 text-muted-foreground" />
				</button>
			))}

			<button
				type="button"
				onClick={() => onChange({ ...filters, categories: [] })}
				className="px-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
			>
				Limpar filtros
			</button>
		</div>
	)
}
