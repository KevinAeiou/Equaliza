import { Button } from "@/src/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/src/components/ui/dialog"
import { FieldGroup } from "@/src/components/ui/field"
import { FormTextField } from "../../auth/components/FormTextField"
import { useInviteDialog } from "../hooks/useInviteDialog"

interface InviteDialogProps {
	open: boolean
	setOpen: (value: boolean) => void
	onSuccess?: () => void
}

export const InviteDialog = ({
	open,
	setOpen,
	onSuccess = () => { },
}: InviteDialogProps) => {
	const {
		form,
		onSubmit,
		loading,
		handleClose,
	} = useInviteDialog({ setOpen, onSuccess })

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) {
					handleClose()
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				<form
					id="form-invite"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<DialogHeader>
						<DialogTitle>Convidar novo membro</DialogTitle>

						<DialogDescription>
							Enviaremos um link para a pessoa criar a conta e entrar na
							família. O convite vale por 7 dias e só pode ser usado uma vez.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						<FormTextField
							control={form.control}
							name="email"
							type="email"
							label="E-mail"
							placeholder="exemplo@email.com"
						/>
					</FieldGroup>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleClose()}
						>
							Cancelar
						</Button>

						<Button
							type="submit"
							form="form-invite"
							disabled={loading}
						>
							{loading ? `Enviando...` : `Enviar convite`}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}