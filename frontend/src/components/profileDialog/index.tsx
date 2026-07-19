"use client"

import { Button } from "@/src/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/src/components/ui/dialog"
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
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Editar perfil</DialogTitle>

					<DialogDescription>
						Altere seu nome e escolha um avatar.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6"
				>
					<FormAvatarField
						control={form.control}
						name="avatar"
						label="Avatar"
					/>

					<div className="flex gap-2">
						<FormTextField
							control={form.control}
							name="first_name"
							label="Nome"
							placeholder="Informe seu nome"
						/>

						<FormTextField
							control={form.control}
							name="last_name"
							label="Sobrenome"
							placeholder="Informe seu sobrenome"
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>

						<Button type="submit">
							Salvar alterações
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}