"use client"

import { UserRound } from "lucide-react"
import { FormDialog } from "@/src/components/formDialog"
import { FormAvatarField } from "../formAvatarField"
import { useProfileDialog } from "./useProfileDialog"
import { FormTextField } from "@/src/features/auth/components/FormTextField"

interface ProfileDialogProps {
	open: boolean
	onOpenChange: (value: boolean) => void
}

export const ProfileDialog = ({
	open,
	onOpenChange,
}: ProfileDialogProps) => {
	const {
		form,
		onSubmit,
	} = useProfileDialog({ open, onOpenChange })

	return (
		<FormDialog
			open={open}
			onClose={() => onOpenChange(false)}
			icon={UserRound}
			title="Editar perfil"
			description="Seu nome e avatar aparecem para os membros das suas famílias."
			formId="form-profile"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel="Salvar alterações"
			loading={form.formState.isSubmitting}
			size="lg"
		>
			<FormAvatarField
				control={form.control}
				name="avatar"
				label="Avatar"
			/>

			<div className="grid gap-4 sm:grid-cols-2">
				<FormTextField
					control={form.control}
					name="first_name"
					label="Nome"
					placeholder="Seu nome"
					autoComplete="given-name"
				/>

				<FormTextField
					control={form.control}
					name="last_name"
					label="Sobrenome"
					placeholder="Seu sobrenome"
					autoComplete="family-name"
				/>
			</div>
		</FormDialog>
	)
}
