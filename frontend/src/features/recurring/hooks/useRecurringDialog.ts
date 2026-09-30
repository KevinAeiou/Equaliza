import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { parseISO } from "date-fns"
import { toast } from "sonner"
import { applyApiValidationErrors, isApiError } from "@/src/lib/utils"
import { CategoryProps, RecurringProps, SelectOption } from "@/src/types"
import { FinanceService } from "../../finance/services/financial.service"
import {
	FormRecurringSchema,
	FormRecurringSchemaType,
	getDefaultValues,
} from "../schemas/recurring.schema"
import { RecurringService } from "../services/recurring.service"

interface UseRecurringDialogProps {
	recurringId?: number
	setOpen: (value: boolean) => void
	setRecurringId: (value?: number) => void
	onSuccess: () => void
	onDelete: (recurring: RecurringProps) => void
}

export const useRecurringDialog = ({
	recurringId,
	setOpen,
	setRecurringId,
	onSuccess,
	onDelete,
}: UseRecurringDialogProps) => {
	const [loading, setLoading] = useState<boolean>(false)
	const [categories, setCategories] = useState<CategoryProps[]>([])
	const [recurring, setRecurring] = useState<RecurringProps | undefined>(undefined)

	const form = useForm<FormRecurringSchemaType>({
		resolver: zodResolver(FormRecurringSchema) as Resolver<FormRecurringSchemaType>,
		defaultValues: getDefaultValues(),
	})

	const type = useWatch({ control: form.control, name: "type" })
	const hasEnd = useWatch({ control: form.control, name: "has_end" })

	const isEditing = recurringId !== undefined

	const categoryOptions: SelectOption<string>[] = categories
		.filter((category) => category.type === type)
		.map((category) => ({
			label: category.name,
			value: category.id.toString(),
		}))

	const handleClose = () => {
		form.reset(getDefaultValues())
		setRecurring(undefined)
		setRecurringId(undefined)
		setOpen(false)
	}

	const onSubmit = async (data: FormRecurringSchemaType) => {
		setLoading(true)

		try {
			if (recurringId) {
				await RecurringService.update(recurringId, data)

				toast.success("Recorrente atualizada com sucesso.")
			} else {
				await RecurringService.create(data)

				toast.success("Recorrente criada com sucesso.")
			}

			handleClose()
			onSuccess()
		} catch (error: unknown) {
			if (!isApiError(error)) return

			if (applyApiValidationErrors(form, error)) return

			toast.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	// Trocar o tipo invalida a categoria escolhida.
	const handleTypeChange = (value: string) => {
		form.setValue("type", value as FormRecurringSchemaType["type"])
		form.setValue("category", undefined as unknown as number)
	}

	const handleDelete = () => {
		if (!recurring) return

		handleClose()
		onDelete(recurring)
	}

	useEffect(() => {
		const loadCategories = async () => {
			try {
				setCategories(await FinanceService.listCategories())
			} catch (error) {
				toast.error(
					isApiError(error)
						? error.message
						: "Erro desconhecido ao listar categorias"
				)
			}
		}

		loadCategories()
	}, [])

	useEffect(() => {
		if (!recurringId) {
			form.reset(getDefaultValues())
			return
		}

		const load = async () => {
			try {
				const response = await RecurringService.retrieve(recurringId)

				setRecurring(response)

				form.reset({
					type: response.type,
					frequency: response.frequency,
					amount: response.amount,
					start_date: parseISO(response.start_date),
					has_end: Boolean(response.end_date),
					end_date: response.end_date ? parseISO(response.end_date) : undefined,
					description: response.description ?? "",
					is_active: response.is_active,
					category: response.category.id,
				})
			} catch (error) {
				toast.error(isApiError(error) ? error.message : "Erro ao buscar recorrente.")
			}
		}

		load()
	}, [recurringId, form])

	return {
		form,
		onSubmit,
		loading,
		handleClose,
		handleDelete,
		handleTypeChange,
		categoryOptions,
		isEditing,
		type,
		hasEnd,
		recurring,
	}
}
