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
import { useDashboardFilters } from "../hooks/useDashboardFilters"
import { FormDateRangeField } from "./FormDateRangeField"
import { FormMultiSelectField } from "./FormMultiSelectField"
import { PeriodType, FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { Separator } from "@/src/components/ui/separator"
import { FormSelectField } from "../../finance/components/FormSelectField"
import { FormSinglePeriodField } from "./FormSiglePeriodField"

interface DashboardFiltersProps {
	showFilter: boolean
	setShowFilter: (value: boolean) => void
	onApply: (filters: FormDashboardFilterSchemaType) => void
}

export const DashboardFilters = ({
	showFilter,
	onApply,
	setShowFilter,
}: DashboardFiltersProps) => {
	const {
		form,
		type,
		onSubmit,
		categoryOptions,
		handleClear,
		periodOptions,
	} = useDashboardFilters({ setShowFilter, onApply })

	return (
		<Sheet
			open={showFilter}
			onOpenChange={setShowFilter}
		>
			<SheetContent className="w-full rounded-l-xl sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Filtros do Dashboard</SheetTitle>
			<SheetContent className="w-full rounded-l-xl sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Filtros do Dashboard</SheetTitle>

					<SheetDescription>
						Selecione os períodos e categorias desejadas.
					</SheetDescription>
				</SheetHeader>

				<form
					id="form-filters"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<div className="flex flex-col gap-4 px-4">
						<div className="flex gap-2 items-end">
							<FormSelectField
								control={form.control}
								name="type"
								label="Período"
								options={periodOptions}
							/>

							{type === PeriodType.PERIOD ? (
								<FormDateRangeField
									control={form.control}
									name="period"
								/>
							) : (
								<FormSinglePeriodField
									name="period"
									control={form.control}
									type={type}
								/>
							)}
						</div>

						<FormMultiSelectField
							control={form.control}
							name="categories"
							label="Categorias"
							placeholder="Todos"
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
						form="form-filters"
						className="w-full"
					>
						Aplicar filtros
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}