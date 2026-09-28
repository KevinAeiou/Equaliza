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

interface DeleteFamilyDialogProps {
	familyName?: string
	onConfirm: () => void
	onClose: () => void
}

export const DeleteFamilyDialog = ({
	familyName,
	onConfirm,
	onClose,
}: DeleteFamilyDialogProps) => (
	<AlertDialog
		open={Boolean(familyName)}
		onOpenChange={(value) => !value && onClose()}
	>
		<AlertDialogContent size="sm">
			<AlertDialogHeader>
				<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
					<Trash2Icon />
				</AlertDialogMedia>

				<AlertDialogTitle>Excluir {familyName}?</AlertDialogTitle>

				<AlertDialogDescription>
					Todas as receitas, despesas, categorias, membros e convites desta família serão
					excluídos permanentemente. Essa ação não pode ser desfeita.
				</AlertDialogDescription>
			</AlertDialogHeader>

			<AlertDialogFooter>
				<AlertDialogCancel
					variant="outline"
					onClick={onClose}
				>
					Cancelar
				</AlertDialogCancel>

				<AlertDialogAction
					variant="destructive"
					onClick={onConfirm}
				>
					Excluir família
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
