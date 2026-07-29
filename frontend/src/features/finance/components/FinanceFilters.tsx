"use client"

import { Button } from "@/src/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/src/components/ui/sheet"
import { Separator } from "@/src/components/ui/separator"

import { FormDateRangeField } from "../../dashboard/components/FormDateRangeField"
import { FormSinglePeriodField } from "../../dashboard/components/FormSiglePeriodField"
import { FormSelectField } from "./FormSelectField"

import { useFinanceFilters } from "../hooks/useFinanceFilters"
import { FormMultiSelectField } from "../../dashboard/components/FormMultiSelectField"
import { FinanceEntryType } from "@/src/types"
import { FormFinanceFilterSchemaType } from "../schemas/filter.schema"
import { PeriodType } from "../../dashboard/schemas/filters.schema"

interface FinanceFiltersProps {
	type: FinanceEntryType
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormFinanceFilterSchemaType) => void
}

export const FinanceFilters = ({
	type,
	showFilter,
	setShowFilter,
	onApply,
}: FinanceFiltersProps) => {
	const {
		form,
		periodType,
		onSubmit,
		categoryOptions,
		periodOptions,
		handleClear,
	} = useFinanceFilters({ setShowFilter, onApply, type })

	return (
		<Sheet
			open={showFilter}
			onOpenChange={setShowFilter}
		>
			<SheetContent className="w-full rounded-l-xl sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Filtros</SheetTitle>

					<SheetDescription>
						Selecione o período e as categorias desejadas.
					</SheetDescription>
				</SheetHeader>

				<form
					id="form-finance-filters"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<div className="flex flex-col gap-4 px-4">
						<div className="flex items-end gap-2">
							<FormSelectField
								control={form.control}
								name="type"
								label="Período"
								options={periodOptions}
							/>

							{periodType === PeriodType.PERIOD ? (
								<FormDateRangeField
									control={form.control}
									name="period"
								/>
							) : (
								<FormSinglePeriodField
									control={form.control}
									name="period"
									type={periodType}
								/>
							)}
						</div>

						<FormMultiSelectField
							control={form.control}
							name="categories"
							label="Categorias"
							placeholder="Todas"
							options={categoryOptions}
						/>
					</div>
				</form>

				<SheetFooter className="gap-4">
					<Separator className="my-2" />

					<Button
						type="button"
						variant="outline"
						onClick={handleClear}
					>
						Limpar filtros
					</Button>

					<Button
						type="submit"
						form="form-finance-filters"
						className="w-full"
					>
						Aplicar filtros
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}