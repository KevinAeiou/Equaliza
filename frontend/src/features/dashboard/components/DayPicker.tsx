"use client"

import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"

import {
	startOfDay,
	endOfDay,
	format,
} from "date-fns"

import { ptBR } from "date-fns/locale"

import { CalendarIcon } from "lucide-react"

import { cn } from "@/src/lib/utils"

import { Button } from "@/src/components/ui/button"

import {
	Field,
	FieldError,
	FieldLabel,
} from "@/src/components/ui/field"

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/src/components/ui/popover"

import { Calendar } from "@/src/components/ui/calendar"

interface DayPickerProps<
	TField extends FieldValues,
> {
	control: Control<TField>
	name: FieldPath<TField>
	label: string
	disabled?: boolean
}

export const DayPicker = <
	TField extends FieldValues,
>({
	control,
	name,
	label,
	disabled = false,
}: DayPickerProps<TField>) => {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel>
						{label}
					</FieldLabel>

					<Popover>
						<PopoverTrigger
							render={
								<Button
									type="button"
									variant="outline"
									disabled={disabled}
									className={cn(
										"w-full justify-between font-normal",
										!field.value?.from &&
										"text-muted-foreground",
									)}
								/>
							}
						>
							{field.value?.from
								? format(
									field.value.from,
									"dd/MM/yyyy",
									{
										locale: ptBR,
									},
								)
								: "Selecione um dia"}

							<CalendarIcon className="h-4 w-4 opacity-60" />
						</PopoverTrigger>

						<PopoverContent
							className="w-auto p-0"
							align="start"
						>
							<Calendar
								mode="single"
								locale={ptBR}
								selected={field.value?.from}
								defaultMonth={field.value?.from}
								disabled={{
									after: startOfDay(new Date()),
								}}
								formatters={{
									formatCaption: (month) =>
										format(month, "MMMM yyyy", {
											locale: ptBR,
										}).replace(/^\w/, (char) =>
											char.toUpperCase(),
										),
								}}
								onSelect={(date) => {
									if (!date) return

									field.onChange({
										from: startOfDay(date),
										to: endOfDay(date),
									})
								}}
							/>
						</PopoverContent>
					</Popover>

					<FieldError
						errors={[fieldState.error]}
					/>
				</Field>
			)}
		/>
	)
}