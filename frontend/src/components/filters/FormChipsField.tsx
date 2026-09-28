"use client"

import { Check } from "lucide-react"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"
import { cn } from "@/src/lib/utils"
import { SelectOption } from "@/src/types"

export interface ChipGroup {
	label?: string
	options: SelectOption<number>[]
}

interface FormChipsFieldProps<TField extends FieldValues> {
	control: Control<TField>
	name: FieldPath<TField>
	groups: ChipGroup[]
	allLabel?: string
	emptyMessage?: string
}

const chipClassName = (selected: boolean) => cn(
	"flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
	selected
		? "border-foreground bg-foreground text-background"
		: "bg-background hover:bg-muted"
)

// Seleção múltipla com as opções à vista. Nenhuma selecionada equivale a "todas".
export const FormChipsField = <TField extends FieldValues>({
	control,
	name,
	groups,
	allLabel = "Todas",
	emptyMessage = "Nenhuma opção disponível.",
}: FormChipsFieldProps<TField>) => (
	<Controller
		control={control}
		name={name}
		render={({ field }) => {
			const selected: number[] = field.value ?? []
			const hasOptions = groups.some((group) => group.options.length)

			const toggle = (value: number) =>
				field.onChange(
					selected.includes(value)
						? selected.filter((item) => item !== value)
						: [...selected, value]
				)

			if (!hasOptions) {
				return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
			}

			return (
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							aria-pressed={!selected.length}
							onClick={() => field.onChange([])}
							className={chipClassName(!selected.length)}
						>
							{allLabel}
						</button>
					</div>

					{groups.filter((group) => group.options.length).map((group) => (
						<div key={group.label ?? "options"} className="flex flex-col gap-2">
							{group.label && (
								<span className="text-xs font-medium text-muted-foreground">
									{group.label}
								</span>
							)}

							<div className="flex flex-wrap gap-2">
								{group.options.map((option) => {
									const active = selected.includes(option.value)

									return (
										<button
											key={option.value}
											type="button"
											aria-pressed={active}
											onClick={() => toggle(option.value)}
											className={chipClassName(active)}
										>
											{active && <Check className="size-3.5" />}
											{option.label}
										</button>
									)
								})}
							</div>
						</div>
					))}
				</div>
			)
		}}
	/>
)
