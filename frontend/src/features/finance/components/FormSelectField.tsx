import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"

import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/src/components/ui/select"
import { SelectOption } from "@/src/types"

interface FormSelectFieldProps<
	TField extends FieldValues,
	TValue extends string | number = string
> {
	control: Control<TField>
	name: FieldPath<TField>
	label: string
	options: SelectOption<TValue>[]
	placeholder?: string
	groupLabel?: string
	disabled?: boolean
}

export const FormSelectField = <
	TField extends FieldValues,
	TValue extends string | number = string,
>({
	control,
	name,
	label,
	options,
	placeholder = "Selecione uma opção",
	groupLabel,
	disabled = false,
}: FormSelectFieldProps<TField, TValue>) => {

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (

				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={`${name}-field`}>
						{label}
					</FieldLabel>

					<Select
						value={
							options.length === 0
								? ""
								: field.value?.toString() ?? ""
						}
						onValueChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
						disabled={disabled || options.length === 0}
						items={options}
					>
						<SelectTrigger
							id={`${name}-field`}
							className="w-full"
							aria-invalid={fieldState.invalid}
						>
							<SelectValue placeholder={
								options.length === 0
									? "Nenhuma opção disponível"
									: placeholder
							} />
						</SelectTrigger>

						<SelectContent>
							{options.length === 0 ? (
								<div className="px-2 py-4 text-center text-sm text-muted-foreground">
									Nenhuma opção disponível.
								</div>
							) : groupLabel ? (
								<SelectGroup>
									<SelectLabel>{groupLabel}</SelectLabel>

									{options.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectGroup>
							) : (
								options.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>

					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	)
}