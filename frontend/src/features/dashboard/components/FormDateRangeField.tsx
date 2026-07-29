import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"

import { format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"

interface FormDateRangeFieldProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label?: string
	placeholder?: string
	disabled?: boolean
}

export const FormDateRangeField = <T extends FieldValues,>({
	control,
	name,
	label = "",
	placeholder = "Selecione um período",
}: FormDateRangeFieldProps<T>) => {
	const [open, setOpen] = useState(false)

	const today = startOfDay(new Date())

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const range = field.value as {
					from: Date
					to?: Date
				} | undefined

				return (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel>
							{label}
						</FieldLabel>

						<Popover
							open={open}
							onOpenChange={setOpen}
						>
							<PopoverTrigger
								render={
									<Button
										type="button"
										variant="outline"
										className="w-full justify-start text-left font-normal"
									/>
								}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />

								{range?.from ? (
									range.to ? (
										`${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`
									) : (
										format(range.from, "dd/MM/yyyy")
									)
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
									mode="range"
									locale={ptBR}
									selected={range}
									disabled={{
										after: today,
									}}
									onSelect={(selectedRange) => {
										field.onChange(selectedRange)

										if (
											selectedRange?.from &&
											selectedRange?.to
										) {
											setOpen(false)
										}
									}}
								/>
							</PopoverContent>
						</Popover>

						<FieldError
							errors={[fieldState.error]}
						/>
					</Field>
				)
			}}
		/>
	)
}