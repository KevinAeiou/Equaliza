import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"
import { NumericFormat } from "react-number-format"

interface FormCurrencyFieldProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
	placeholder?: string
	disabled?: boolean
}

export const FormCurrencyField = <T extends FieldValues,>({
	control,
	name,
	label,
	placeholder,
	disabled = false,
}: FormCurrencyFieldProps<T>) => {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={`${name}-field`}>
						{label}
					</FieldLabel>

					<NumericFormat
						customInput={Input}
						id={`${name}-field`}
						value={field.value ?? ""}
						onValueChange={({ floatValue }) =>
							field.onChange(floatValue ?? 0)
						}
						onBlur={field.onBlur}
						getInputRef={field.ref}
						thousandSeparator="."
						decimalSeparator=","
						decimalScale={2}
						fixedDecimalScale
						allowNegative={false}
						prefix="R$ "
						placeholder={placeholder}
						disabled={disabled}
						aria-invalid={fieldState.invalid}
					/>

					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	)
}