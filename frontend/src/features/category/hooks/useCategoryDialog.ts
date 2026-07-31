import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { CategoryService } from "../services/category.service"

import { applyApiValidationErrors, isApiError } from "@/src/lib/utils"

import {
	FormCategorySchema,
	FormCategorySchemaType,
	getDefaultValues,
} from "../schemas/category.schema"

import { CategoryProps } from "@/src/types"

interface UseCategoryDialogProps {
	setOpen: (value: boolean) => void
	onSuccess: () => void
	selectedCategory?: CategoryProps
	setSelectedCategory: (value?: CategoryProps) => void
}

export const useCategoryDialog = ({
	setOpen,
	onSuccess,
	selectedCategory,
	setSelectedCategory,
}: UseCategoryDialogProps) => {
	const [loading, setLoading] = useState(false)

	const form = useForm<FormCategorySchemaType>({
		resolver: zodResolver(FormCategorySchema),
		defaultValues: getDefaultValues(),
	})

	const onSubmit = async (data: FormCategorySchemaType) => {
		setLoading(true)

		try {
			if (selectedCategory) {
				await CategoryService.update(selectedCategory.id, data)

				toast.success("Categoria atualizada com sucesso.")

				handleClose()

				onSuccess()

				return
			}

			await CategoryService.create(data)

			toast.success("Categoria criada com sucesso!")

			handleClose()

			onSuccess()
		} catch (error: unknown) {
			if (!isApiError(error)) return

			if (applyApiValidationErrors(form, error)) {
				return
			}

			toast.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		form.reset(getDefaultValues())
		setOpen(false)
		setSelectedCategory(undefined)
	}

	useEffect(() => {
		if (selectedCategory) {
			form.reset({
				name: selectedCategory.name,
				type: selectedCategory.type,
			})

			return
		}

		form.reset(getDefaultValues())
	}, [selectedCategory, form])

	return {
		form,
		onSubmit,
		loading,
		handleClose,
	}
}