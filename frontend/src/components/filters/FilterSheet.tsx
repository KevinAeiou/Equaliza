"use client"

import { FormEventHandler, ReactNode } from "react"
import { Button } from "@/src/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/src/components/ui/sheet"

interface FilterSheetProps {
	open: boolean
	onOpenChange: (value: boolean) => void
	title: string
	description: string
	formId: string
	onSubmit: FormEventHandler<HTMLFormElement>
	onClear: () => void
	children: ReactNode
}

export const FilterSheet = ({
	open,
	onOpenChange,
	title,
	description,
	formId,
	onSubmit,
	onClear,
	children,
}: FilterSheetProps) => (
	<Sheet
		open={open}
		onOpenChange={onOpenChange}
	>
		<SheetContent className="w-full gap-0 data-[side=right]:w-full sm:max-w-md data-[side=right]:sm:max-w-md">
			<SheetHeader className="border-b px-6 py-5 pr-12">
				<SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
				<SheetDescription>{description}</SheetDescription>
			</SheetHeader>

			<form
				id={formId}
				onSubmit={onSubmit}
				className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-6"
			>
				{children}
			</form>

			<SheetFooter className="grid grid-cols-2 gap-3 border-t px-6 py-4">
				<Button
					type="button"
					variant="outline"
					className="h-10"
					onClick={onClear}
				>
					Limpar filtros
				</Button>

				<Button
					type="submit"
					form={formId}
					className="h-10"
				>
					Aplicar
				</Button>
			</SheetFooter>
		</SheetContent>
	</Sheet>
)
