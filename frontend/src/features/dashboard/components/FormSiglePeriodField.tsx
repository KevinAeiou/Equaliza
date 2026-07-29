"use client"

import {
	Control,
	FieldPath,
	FieldValues,
} from "react-hook-form"

import { PeriodType } from "../schemas/filters.schema"

import { DayPicker } from "./DayPicker"
import { WeekPicker } from "./WeekPicker"
import { MonthPicker } from "./MonthPicker"
import { YearPicker } from "./YearPicker"

interface FormSinglePeriodFieldProps<
	TField extends FieldValues,
> {
	control: Control<TField>
	name: FieldPath<TField>
	label?: string
	type: PeriodType
	disabled?: boolean
}

export const FormSinglePeriodField = <
	TField extends FieldValues,
>({
	control,
	name,
	label = "",
	type,
	disabled = false,
}: FormSinglePeriodFieldProps<TField>) => {

	switch (type) {

		case PeriodType.DAY:
			return (
				<DayPicker
					control={control}
					name={name}
					label={label}
					disabled={disabled}
				/>
			)

		case PeriodType.WEEK:
			return (
				<WeekPicker
					control={control}
					name={name}
					label={label}
					disabled={disabled}
				/>
			)

		case PeriodType.MONTH:
			return (
				<MonthPicker
					control={control}
					name={name}
					label={label}
					disabled={disabled}
				/>
			)

		case PeriodType.YEAR:
			return (
				<YearPicker
					control={control}
					name={name}
					label={label}
					disabled={disabled}
				/>
			)

		default:
			return null
	}
}