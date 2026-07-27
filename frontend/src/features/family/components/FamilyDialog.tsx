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
import { useFamilyDialog } from "../hooks/useFamilyDialog"
import { FamilyProps } from "@/src/types"
import { formatDate } from "@/src/lib/utils"

interface FamilyDialogProps {
	open: boolean
	setOpen: (value: boolean) => void
	onSuccess: () => void
	selectedFamily?: FamilyProps
	setSelectedFamily: (family?: FamilyProps) => void
}

export const FamilyDialog = ({
	open,
	setOpen,
	onSuccess,
	selectedFamily,
	setSelectedFamily,
}: FamilyDialogProps) => {
	const {
		form,
		onSubmit,
		loading,
		handleClose,
	} = useFamilyDialog({ setOpen, onSuccess, selectedFamily, setSelectedFamily })

	const isEditing = selectedFamily !== undefined

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
					id="form-family"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<DialogHeader>
						<DialogTitle>
							{isEditing
								? `Editar `
								: `Criar `
							}
							família
						</DialogTitle>

						<DialogDescription>
							Informe um nome para a sua família. Depois de criada,
							você poderá convidar outros membros para participar e
							gerenciar as finanças em conjunto.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						<FormTextField
							control={form.control}
							name="name"
							label="Nome da família"
							placeholder="Ex.: Família Silva"
						/>
					</FieldGroup>

					{isEditing && selectedFamily && (
						<div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
							<div className="flex justify-between gap-4">
								<span className="font-medium text-muted-foreground">
									Criado em
								</span>

								<span className="font-medium text-muted-foreground">
									{selectedFamily.created_at && formatDate(selectedFamily.created_at)}
								</span>
							</div>

							<div className="flex justify-between gap-4">
								<span className="font-medium text-muted-foreground">
									Última atualização
								</span>

								<span className="font-medium text-muted-foreground">
									{selectedFamily.updated_at && formatDate(selectedFamily.updated_at)}
								</span>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
						>
							Cancelar
						</Button>

						<Button
							type="submit"
							form="form-family"
							disabled={loading}
						>
							{loading
								? "Salvando..."
								: isEditing
									? `Salvar alterações`
									: "Criar família"
							}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}