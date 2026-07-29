"use client"

import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
	useWatch,
} from "react-hook-form"

import {
	endOfMonth,
	format,
	isAfter,
	startOfMonth,
} from "date-fns"

import { ptBR } from "date-fns/locale"

import {
	CalendarIcon,
	ChevronLeft,
	ChevronRight,
} from "lucide-react"

import { useState } from "react"

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

interface MonthPickerProps<
	TField extends FieldValues,
> {
	control: Control<TField>
	name: FieldPath<TField>
	label: string
	disabled?: boolean
}

const MONTHS = Array.from({ length: 12 }, (_, month) => {
	const monthName = format(new Date(2025, month), "MMMM", {
		locale: ptBR,
	})

	return monthName.charAt(0).toUpperCase() + monthName.slice(1)
})

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export const MonthPicker = <
	TField extends FieldValues,
>({
	control,
	name,
	label,
	disabled = false,
}: MonthPickerProps<TField>) => {
	const value = useWatch({
		control,
		name,
	})

	const selectedYear = value?.from?.getFullYear() ?? new Date().getFullYear()

	const [year, setYear] = useState<number>(() => selectedYear)

	const selectedMonth = value?.from?.getMonth()

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				return (
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
											!value &&
											"text-muted-foreground",
										)}
									/>
								}
							>
								{value
									? capitalize(
										format(
											value.from,
											"MMMM 'de' yyyy",
											{
												locale: ptBR,
											},
										),
									)
									: "Selecione um mês"}
								<CalendarIcon className="h-4 w-4 opacity-60" />
							</PopoverTrigger>

							<PopoverContent
								className="w-80"
								align="start"
							>
								<div className="flex items-center justify-between mb-4">
									<Button
										size="icon"
										variant="ghost"
										onClick={() => setYear(year - 1)}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>

									<span className="font-medium">
										{year}
									</span>

									<Button
										size="icon"
										variant="ghost"
										disabled={year >= new Date().getFullYear()}
										onClick={() => setYear((current) => current + 1)}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>

								<div className="grid grid-cols-3 gap-2">
									{MONTHS.map((month, index) => {
										const date = new Date(year, index, 1)

										const isDisabled = isAfter(
											startOfMonth(date),
											startOfMonth(new Date()),
										)

										const selected =
											selectedMonth === index &&
											selectedYear === year

										return (
											<Button
												key={month}
												type="button"
												disabled={isDisabled}
												variant={
													selected
														? "default"
														: "outline"
												}
												onClick={() => {
													const date = new Date(
														year,
														index,
														1,
													)

													field.onChange({
														from: startOfMonth(date),
														to: endOfMonth(date),
													})
												}}
											>
												{month}
											</Button>
										)
									})}
								</div>
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