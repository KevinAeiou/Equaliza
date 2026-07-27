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
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"
import { Separator } from "@/src/components/ui/separator"

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
		onSubmit,
		categoryOptions,
	} = useDashboardFilters({ setShowFilter, onApply })

	return (
		<Sheet
			open={showFilter}
			onOpenChange={setShowFilter}
		>
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

					<div className="flex flex-col gap-6 px-4">

						<FormDateRangeField
							control={form.control}
							name="period"
							label="Período"
						/>


						<FormMultiSelectField
							control={form.control}
							name="categories"
							label="Categorias"
							placeholder="Todos"
							options={categoryOptions}
						/>
					</div>
				</form>

				<SheetFooter>
					<Separator className="my-2" />

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