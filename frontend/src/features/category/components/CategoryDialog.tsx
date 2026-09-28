import { Tag } from "lucide-react"
import { FormDialog } from "@/src/components/formDialog"
import { FormSegmentedField } from "@/src/components/filters"
import { Field, FieldGroup, FieldLabel } from "@/src/components/ui/field"

import { FormTextField } from "../../auth/components/FormTextField"

import { CategoryProps } from "@/src/types"
import { useCategoryDialog } from "../hooks/useCategoryDialog"

interface CategoryDialogProps {
	open: boolean
	setOpen: (value: boolean) => void
	onSuccess?: () => void
	selectedCategory?: CategoryProps
	setSelectedCategory?: (category?: CategoryProps) => void
}

const TYPE_OPTIONS = [
	{ label: "Despesa", value: "EXPENSE" },
	{ label: "Receita", value: "INCOME" },
]

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
	// O backend não permite mudar o tipo de uma categoria que já tem lançamentos.
	const typeLocked = isEditing && (selectedCategory?.usage_count ?? 0) > 0

	return (
		<FormDialog
			open={open}
			onClose={handleClose}
			icon={Tag}
			title={isEditing ? "Editar categoria" : "Nova categoria"}
			description="Categorias organizam as receitas e despesas da família."
			formId="form-category"
			onSubmit={form.handleSubmit(onSubmit)}
			submitLabel={isEditing ? "Salvar alterações" : "Criar categoria"}
			loading={loading}
		>
			<FieldGroup>
				<FormTextField
					control={form.control}
					name="name"
					label="Nome"
					placeholder="Ex.: Pets"
				/>

				<Field>
					<FieldLabel>Tipo</FieldLabel>

					<FormSegmentedField
						control={form.control}
						name="type"
						label="Tipo da categoria"
						options={TYPE_OPTIONS}
						disabled={typeLocked}
					/>

					{typeLocked && (
						<p className="text-xs text-muted-foreground">
							O tipo não pode ser alterado porque a categoria já tem lançamentos.
						</p>
					)}
				</Field>
			</FieldGroup>
		</FormDialog>
	)
}
