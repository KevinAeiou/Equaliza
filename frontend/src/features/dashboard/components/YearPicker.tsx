"use client"

import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"

import {
	endOfYear,
	format,
	startOfYear,
} from "date-fns"

import {
	CalendarIcon,
	ChevronLeft,
	ChevronRight,
} from "lucide-react"

import { useMemo, useState } from "react"

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

interface YearPickerProps<
	TField extends FieldValues,
> {
	control: Control<TField>
	name: FieldPath<TField>
	label: string
	disabled?: boolean
}

const YEARS_PER_PAGE = 12

export const YearPicker = <
	TField extends FieldValues,
>({
	control,
	name,
	label,
	disabled = false,
}: YearPickerProps<TField>) => {
	const currentYear = new Date().getFullYear()

	const [baseYear, setBaseYear] = useState(
		currentYear - (currentYear % YEARS_PER_PAGE),
	)

	const years = useMemo(() =>
		Array.from(
			{ length: YEARS_PER_PAGE },
			(_, index) => baseYear + index,
		), [baseYear]
	)

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
											!field.value &&
											"text-muted-foreground",
										)}
									/>
								}
							>
								{field.value
									? format(
										field.value.from,
										"yyyy",
									)
									: "Selecione um ano"}

								<CalendarIcon className="h-4 w-4 opacity-60" />
							</PopoverTrigger>

							<PopoverContent
								align="start"
								className="w-80"
							>
								<div className="mb-4 flex items-center justify-between">
									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={() =>
											setBaseYear(
												baseYear - YEARS_PER_PAGE,
											)
										}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>

									<span className="font-medium">
										{baseYear} - {baseYear + YEARS_PER_PAGE - 1}
									</span>

									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={() =>
											setBaseYear(
												baseYear + YEARS_PER_PAGE,
											)
										}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>

								</div>

								<div className="grid grid-cols-3 gap-2">
									{years.map((year) => {
										const selected = field.value?.from?.getFullYear() === year
										const disabledYear = year > new Date().getFullYear()

										return (
											<Button
												key={year}
												type="button"
												variant={
													selected
														? "default"
														: "outline"
												}
												disabled={disabledYear}
												onClick={() => {
													const date = new Date(
														year,
														0,
														1,
													)

													field.onChange({
														from: startOfYear(date),
														to: endOfYear(date),
													})
												}}
											>
												{year}
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