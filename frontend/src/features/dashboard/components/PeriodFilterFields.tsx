"use client"

import { Control, FieldPath, FieldValues } from "react-hook-form"
import { FilterSection, FormSegmentedField } from "@/src/components/filters"
import { SelectOption } from "@/src/types"
import { PeriodType } from "../schemas/filters.schema"
import { FormDateRangeField } from "./FormDateRangeField"
import { FormSinglePeriodField } from "./FormSiglePeriodField"

export const PERIOD_OPTIONS: SelectOption<string>[] = [
	{ label: "Dia", value: PeriodType.DAY },
	{ label: "Semana", value: PeriodType.WEEK },
	{ label: "Mês", value: PeriodType.MONTH },
	{ label: "Ano", value: PeriodType.YEAR },
	{ label: "Intervalo", value: PeriodType.PERIOD },
]

const PICKER_LABELS: Record<PeriodType, string> = {
	[PeriodType.DAY]: "Dia",
	[PeriodType.WEEK]: "Semana",
	[PeriodType.MONTH]: "Mês",
	[PeriodType.YEAR]: "Ano",
	[PeriodType.PERIOD]: "De – até",
}

interface PeriodFilterFieldsProps<TField extends FieldValues> {
	control: Control<TField>
	typeName: FieldPath<TField>
	periodName: FieldPath<TField>
	type: PeriodType
}

export const PeriodFilterFields = <TField extends FieldValues>({
	control,
	typeName,
	periodName,
	type,
}: PeriodFilterFieldsProps<TField>) => (
	<FilterSection title="Período">
		<FormSegmentedField
			control={control}
			name={typeName}
			label="Tipo de período"
			options={PERIOD_OPTIONS}
		/>

		{type === PeriodType.PERIOD ? (
			<FormDateRangeField
				control={control}
				name={periodName}
				label={PICKER_LABELS[type]}
			/>
		) : (
			<FormSinglePeriodField
				control={control}
				name={periodName}
				label={PICKER_LABELS[type]}
				type={type}
			/>
		)}
	</FilterSection>
)
