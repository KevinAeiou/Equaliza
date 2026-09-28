import { Mail } from "lucide-react"
import { FormDialog } from "@/src/components/formDialog"
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
		<FormDialog
			open={open}
			onClose={handleClose}
			icon={Mail}
			title="Convidar para a família"
			description="Enviaremos um link para a pessoa criar a conta e entrar na família. O convite vale por 7 dias e só pode ser usado uma vez."
			formId="form-invite"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel="Enviar convite"
			loading={loading}
			loadingLabel="Enviando..."
		>
			<FieldGroup>
				<FormTextField
					control={form.control}
					name="email"
					type="email"
					label="E-mail"
					placeholder="pessoa@exemplo.com"
				/>
			</FieldGroup>
		</FormDialog>
	)
}
