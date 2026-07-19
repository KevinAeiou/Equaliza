import { ptBR } from "date-fns/locale"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"

import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/src/components/ui/popover"
import { useState } from "react"

interface FormDateFieldProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
	placeholder?: string
	disabled?: boolean
}

export const FormDateField = <T extends FieldValues,>({
	control,
	name,
	label,
	placeholder = "Selecione uma data",
	disabled = false,
}: FormDateFieldProps<T>) => {
	const [open, setOpen] = useState(false)

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const date = typeof field.value === "string"
					? parseISO(field.value)
					: field.value

				return (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={`${name}-field`}>
							{label}
						</FieldLabel>

						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger
								render={
									<Button
										id={`${name}-field`}
										type="button"
										variant="outline"
										disabled={disabled}
										aria-invalid={fieldState.invalid}
										className="justify-start text-left font-normal w-full"
										data-empty={!field.value}
									/>
								}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />

								{date ? (
									format(date, "dd/MM/yyyy")
								) : (
									<span className="text-muted-foreground">
										{placeholder}
									</span>
								)}
							</PopoverTrigger>

							<PopoverContent
								className="w-auto p-0"
								align="start"
							>
								<Calendar
									mode="single"
									locale={ptBR}
									selected={date}
									onSelect={(selectedDate) => {
										field.onChange(selectedDate)
										setOpen(false)
									}}
								/>
							</PopoverContent>
						</Popover>

						<FieldError errors={[fieldState.error]} />
					</Field>
				)
			}}
		/>
	)
}