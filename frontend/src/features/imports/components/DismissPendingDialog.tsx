import { EyeOffIcon } from "lucide-react"
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

interface DismissPendingDialogProps {
	count?: number
	onConfirm: () => void
	onClose: () => void
}

export const DismissPendingDialog = ({ count, onConfirm, onClose }: DismissPendingDialogProps) => (
	<AlertDialog open={count !== undefined} onOpenChange={(value) => !value && onClose()}>
		<AlertDialogContent size="sm">
			<AlertDialogHeader>
				<AlertDialogMedia>
					<EyeOffIcon />
				</AlertDialogMedia>

				<AlertDialogTitle>
					Marcar {count === 1 ? "como lida" : `${count} pendências como lidas`}?
				</AlertDialogTitle>

				<AlertDialogDescription>
					Elas saem da lista e a descrição é apagada. Reenviar o mesmo arquivo não as traz de volta.
				</AlertDialogDescription>
			</AlertDialogHeader>

			<AlertDialogFooter>
				<AlertDialogCancel variant="outline" onClick={onClose}>
					Cancelar
				</AlertDialogCancel>

				<AlertDialogAction onClick={onConfirm}>Marcar como lida</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
