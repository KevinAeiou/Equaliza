import { Trash2Icon } from "lucide-react"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/src/components/ui/alert-dialog"
import { formatCurrency } from "@/src/lib/utils"
import { RecurringProps } from "@/src/types"
import { describeSchedule } from "../utils"

interface DeleteRecurringDialogProps {
	recurring?: RecurringProps
	onConfirm: () => void
	onClose: () => void
}

export const DeleteRecurringDialog = ({
	recurring,
	onConfirm,
	onClose,
}: DeleteRecurringDialogProps) => (
	<AlertDialog
		open={Boolean(recurring)}
		onOpenChange={(value) => !value && onClose()}
	>
		<AlertDialogContent size="sm">
			<AlertDialogHeader>
				<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
					<Trash2Icon />
				</AlertDialogMedia>

				<AlertDialogTitle>Excluir recorrente?</AlertDialogTitle>

				<AlertDialogDescription>
					Nenhum novo lançamento será criado. Os lançamentos já registrados continuam em Finanças.
				</AlertDialogDescription>
			</AlertDialogHeader>

			{recurring && (
				<div className="rounded-xl border p-3 text-sm">
					<div className="flex items-baseline justify-between gap-2">
						<span className="truncate font-medium">
							{recurring.description || recurring.category.name}
						</span>
						<span className="font-semibold tabular-nums">
							{formatCurrency(Number(recurring.amount))}
						</span>
					</div>
					<span className="text-xs text-muted-foreground">
						{recurring.category.name} · {describeSchedule(recurring.frequency, recurring.start_date)}
					</span>
				</div>
			)}

			<AlertDialogFooter>
				<AlertDialogCancel variant="outline" onClick={onClose}>
					Cancelar
				</AlertDialogCancel>

				<AlertDialogAction variant="destructive" onClick={onConfirm}>
					Excluir recorrente
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
