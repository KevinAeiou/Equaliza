import { UsersRound } from "lucide-react"
import { FormDialog } from "@/src/components/formDialog"
import { FieldGroup } from "@/src/components/ui/field"

import { FormTextField } from "../../auth/components/FormTextField"
import { useFamilyDialog } from "../hooks/useFamilyDialog"
import { FamilyProps } from "@/src/types"
import { formatDate } from "@/src/lib/utils"

interface FamilyDialogProps {
	open: boolean
	setOpen: (value: boolean) => void
	onSuccess?: () => void
	selectedFamily?: FamilyProps
	setSelectedFamily?: (family?: FamilyProps) => void
}

export const FamilyDialog = ({
	open,
	setOpen,
	onSuccess = () => { },
	selectedFamily,
	setSelectedFamily = () => { },
}: FamilyDialogProps) => {
	const {
		form,
		onSubmit,
		loading,
		handleClose,
	} = useFamilyDialog({ setOpen, onSuccess, selectedFamily, setSelectedFamily })

	const isEditing = selectedFamily !== undefined

	return (
		<FormDialog
			open={open}
			onClose={handleClose}
			icon={UsersRound}
			iconClassName="bg-income-soft text-income"
			title={isEditing ? "Renomear família" : "Nova família"}
			description={
				isEditing
					? "O novo nome aparece para todos os membros."
					: "Depois de criar a família, você poderá convidar pessoas para dividir as finanças."
			}
			formId="form-family"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel={isEditing ? "Salvar alterações" : "Criar família"}
			loading={loading}
		>
			<FieldGroup>
				<FormTextField
					control={form.control}
					name="name"
					label="Nome da família"
					placeholder="Ex.: Família Silva"
				/>
			</FieldGroup>

			{isEditing && selectedFamily?.created_at && (
				<p className="text-xs text-muted-foreground">
					Criada em {formatDate(selectedFamily.created_at)}
				</p>
			)}
		</FormDialog>
	)
}
