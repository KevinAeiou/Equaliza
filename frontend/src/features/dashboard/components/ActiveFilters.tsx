"use client"

import { X } from "lucide-react"
import { SelectOption } from "@/src/types"

interface FilterValues {
	categories: number[]
	members?: number[]
}

interface ActiveFiltersProps<T extends FilterValues> {
	filters: T
	categoryOptions: SelectOption<number>[]
	memberOptions?: SelectOption<number>[]
	onChange: (filters: T) => void
}

export const ActiveFilters = <T extends FilterValues>({
	filters,
	categoryOptions,
	memberOptions = [],
	onChange,
}: ActiveFiltersProps<T>) => {
	const members = filters.members ?? []

	if (!filters.categories.length && !members.length) return null

	const categoryLabels = new Map(categoryOptions.map((option) => [option.value, option.label]))
	const memberLabels = new Map(memberOptions.map((option) => [option.value, option.label]))

	const removeCategory = (id: number) =>
		onChange({
			...filters,
			categories: filters.categories.filter((category) => category !== id),
		})

	const removeMember = (id: number) =>
		onChange({
			...filters,
			members: members.filter((member) => member !== id),
		})

	const chips = [
		...filters.categories.map((id) => ({
			key: `category-${id}`,
			label: categoryLabels.get(id) ?? "Categoria",
			onRemove: () => removeCategory(id),
		})),
		...members.map((id) => ({
			key: `member-${id}`,
			label: memberLabels.get(id) ?? "Membro",
			onRemove: () => removeMember(id),
		})),
	]

	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((chip) => (
				<button
					key={chip.key}
					type="button"
					onClick={chip.onRemove}
					aria-label={`Remover filtro ${chip.label}`}
					className="flex h-8 items-center gap-1.5 rounded-full border bg-card pr-2 pl-3 text-sm transition-colors hover:bg-muted"
				>
					{chip.label}
					<X className="size-3.5 text-muted-foreground" />
				</button>
			))}

			<button
				type="button"
				onClick={() =>
					onChange({
						...filters,
						categories: [],
						...(filters.members ? { members: [] } : {}),
					})
				}
				className="px-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
			>
				Limpar filtros
			</button>
		</div>
	)
}
