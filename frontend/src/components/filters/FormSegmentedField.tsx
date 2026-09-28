"use client"

import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"
import { cn } from "@/src/lib/utils"
import { SelectOption } from "@/src/types"

interface FormSegmentedFieldProps<TField extends FieldValues> {
	control: Control<TField>
	name: FieldPath<TField>
	label: string
	options: SelectOption<string>[]
}

// Escolha única com todas as opções à vista, no lugar de um select para poucas opções.
export const FormSegmentedField = <TField extends FieldValues>({
	control,
	name,
	label,
	options,
}: FormSegmentedFieldProps<TField>) => (
	<Controller
		control={control}
		name={name}
		render={({ field }) => (
			<div
				role="radiogroup"
				aria-label={label}
				className="flex gap-1 rounded-lg bg-muted p-1"
			>
				{options.map((option) => {
					const selected = field.value === option.value

					return (
						<button
							key={option.value}
							type="button"
							role="radio"
							aria-checked={selected}
							onClick={() => field.onChange(option.value)}
							className={cn(
								"h-9 min-w-0 flex-1 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors",
								selected
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							{option.label}
						</button>
					)
				})}
			</div>
		)}
	/>
)
