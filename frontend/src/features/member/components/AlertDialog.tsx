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

interface AlertDialogDestructiveProps {
	open: boolean
	handleOnDelete: () => void
	handleOnClose: () => void
}

export const AlertDialogDestructive = ({
	open,
	handleOnDelete,
	handleOnClose,
}: AlertDialogDestructiveProps) => {
	return (
		<AlertDialog
			open={open}
			onOpenChange={handleOnClose}
		>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
						<Trash2Icon />
					</AlertDialogMedia>

					<AlertDialogTitle>Remover membro?</AlertDialogTitle>

					<AlertDialogDescription>
						Esta ação removerá o membro da família e excluirá permanentemente todos os dados vinculados a ele dentro desta família. Essa ação não pode ser desfeita.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel
						variant="outline"
						onClick={handleOnClose}
					>
						Cancelar
					</AlertDialogCancel>

					<AlertDialogAction
						variant="destructive"
						onClick={handleOnDelete}
					>
						Remover
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
