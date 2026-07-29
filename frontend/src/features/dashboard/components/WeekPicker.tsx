"use client"

import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"

import {
	endOfWeek,
	format,
	isAfter,
	isBefore,
	isSameDay,
	startOfDay,
	startOfWeek,
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

interface WeekPickerProps<
	TField extends FieldValues,
> {
	control: Control<TField>
	name: FieldPath<TField>
	label: string
	disabled?: boolean
	weekStartsOn?: 0 | 1
}

export const WeekPicker = <
	TField extends FieldValues,
>({
	control,
	name,
	label,
	disabled = false,
	weekStartsOn = 0,
}: WeekPickerProps<TField>) => {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const selected = field.value

				return (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel>{label}</FieldLabel>

						<Popover>
							<PopoverTrigger
								render={
									<Button
										type="button"
										variant="outline"
										disabled={disabled}
										className={cn(
											"w-full justify-between font-normal",
											!selected &&
											"text-muted-foreground",
										)}
									/>
								}
							>
								{selected
									? `${format(selected.from, "dd/MM/yyyy")} - ${format(selected.to, "dd/MM/yyyy")}`
									: "Selecione uma semana"}

								<CalendarIcon className="h-4 w-4 opacity-60" />
							</PopoverTrigger>

							<PopoverContent
								align="start"
								className="w-auto p-0"
							>
								<Calendar
									mode="single"
									locale={ptBR}
									weekStartsOn={weekStartsOn}
									selected={selected?.from}
									defaultMonth={selected?.from}
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
									onSelect={(day) => {
										if (!day) return

										field.onChange({
											from: startOfWeek(day, {
												weekStartsOn,
											}),
											to: endOfWeek(day, {
												weekStartsOn,
											}),
										})
									}}
									modifiers={{
										weekStart: (day) =>
											selected &&
											isSameDay(day, selected.from),

										weekMiddle: (day) =>
											selected &&
											isAfter(day, selected.from) &&
											isBefore(day, selected.to),

										weekEnd: (day) =>
											selected &&
											isSameDay(day, selected.to),
									}}
									modifiersClassNames={{
										weekStart:
											"bg-primary text-primary-foreground rounded-l-md rounded-r-none",

										weekMiddle:
											"bg-primary/20 rounded-none",

										weekEnd:
											"bg-primary text-primary-foreground rounded-r-md rounded-l-none",
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