import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"


interface FormTextFieldProps<T extends FieldValues> {
	control:  Control<T>
	name: FieldPath<T>
	label: string
    placeholder?: string
    type?: React.HTMLInputTypeAttribute
    disabled?: boolean
    autoComplete?: string
}

export const FormTextField = <T extends FieldValues,>({
    control,
    name,
    label,
    placeholder,
    type = "text",
    disabled = false,
    autoComplete = "off",
}: FormTextFieldProps<T>) => {

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState}) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={`${name}-field`}>
						{label}
					</FieldLabel>

					<Input
						{...field}
						id={`${name}-field`}
						aria-invalid={fieldState.invalid}
						placeholder={placeholder}
						type={type}
						autoComplete={autoComplete}
						disabled={disabled}
					/>

					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	)
}