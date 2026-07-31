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


import { CategoryProps } from "@/src/types"
import { useCategoryDialog } from "../hooks/useCategoryDialog"
import { FormSelectField } from "../../finance/components/FormSelectField"

interface CategoryDialogProps {
	open: boolean
	setOpen: (value: boolean) => void
	onSuccess?: () => void
	selectedCategory?: CategoryProps
	setSelectedCategory?: (category?: CategoryProps) => void
}

export const CategoryDialog = ({
	open,
	setOpen,
	onSuccess = () => { },
	selectedCategory,
	setSelectedCategory = () => { },
}: CategoryDialogProps) => {
	const {
		form,
		onSubmit,
		loading,
		handleClose,
	} = useCategoryDialog({
		setOpen,
		onSuccess,
		selectedCategory,
		setSelectedCategory,
	})

	const isEditing = selectedCategory !== undefined

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
					id="form-category"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<DialogHeader>
						<DialogTitle>
							{isEditing
								? "Editar categoria"
								: "Criar categoria"}
						</DialogTitle>

						<DialogDescription>
							Cadastre categorias para organizar receitas e despesas da
							sua família.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						<FormTextField
							control={form.control}
							name="name"
							label="Nome"
							placeholder="Ex.: Alimentação"
						/>

						<FormSelectField
							control={form.control}
							name="type"
							label="Tipo"
							options={[
								{
									label: "Despesa",
									value: "EXPENSE",
								},
								{
									label: "Receita",
									value: "INCOME",
								},
							]}
						/>
					</FieldGroup>

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
							form="form-category"
							disabled={loading}
						>
							{loading
								? "Salvando..."
								: isEditing
									? "Salvar alterações"
									: "Criar categoria"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}