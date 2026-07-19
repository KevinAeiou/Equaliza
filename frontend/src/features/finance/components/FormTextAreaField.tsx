import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import { Textarea } from "@/src/components/ui/textarea"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"


interface FormTextAreaFieldProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
	placeholder?: string
	disabled?: boolean
	rows?: number
	maxLength?: number
}


export const FormTextAreaField = <T extends FieldValues,>({
	control,
	name,
	label,
	placeholder,
	disabled = false,
	rows = 4,
	maxLength,
}: FormTextAreaFieldProps<T>) => {

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => {
				const characterCount = field.value?.length ?? 0

				return (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={`${name}-field`}>
							{label}
						</FieldLabel>

						<Textarea
							{...field}
							id={`${name}-field`}
							aria-invalid={fieldState.invalid}
							placeholder={placeholder}
							disabled={disabled}
							rows={rows}
							maxLength={maxLength}
							className="max-h-40 overflow-y-auto resize-none"
						/>
						{maxLength && (
							<div className="text-muted-foreground text-xs text-right">
								{characterCount}/{maxLength}
							</div>
						)}

						<FieldError errors={[fieldState.error]} />
					</Field>
				)
			}}
		/>
	)
}