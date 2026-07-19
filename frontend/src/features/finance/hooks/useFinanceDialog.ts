import { isApiError } from "@/src/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Resolver } from "react-hook-form"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { FinanceService } from "../services/financial.service"
import { defaultValues as getDefaultValues, FormFinanceSchema, FormFinanceSchemaType } from "../schemas/finance.schema"
import { CategoryProps, FinanceEntryType, SelectOption } from "@/src/types"
import { FinanceResponse } from "../infra/finance"
import { parseISO } from "date-fns"

interface UseFinanceDialogProps<T extends FinanceEntryType> {
	type: T
	financeId?: number
	setOpen: (value: boolean) => void
	setFinanceId: (value?: number) => void
	onSuccess: () => void
}

export const useFinanceDialog = <T extends FinanceEntryType>({
	type,
	financeId,
	setOpen,
	setFinanceId,
	onSuccess,
}: UseFinanceDialogProps<T>) => {
	const [loading, setLoading] = useState<boolean>(false)
	const [categories, setCategories] = useState<CategoryProps[]>([])
	const [finance, setFinance] = useState<FinanceResponse<T> | undefined>(undefined)

	const form = useForm<FormFinanceSchemaType>({
		resolver: zodResolver(FormFinanceSchema) as Resolver<FormFinanceSchemaType>,
		defaultValues: getDefaultValues(),
	})

	const categoryOptions: SelectOption<string>[] = categories.map((category) => ({
		label: category.name,
		value: category.id.toString(),
	}))

	const onSubmit = async (data: FormFinanceSchemaType) => {
		setLoading(true)

		try {
			if (financeId) {
				await FinanceService.update(type, financeId, data)

				toast.success("Finança atualizada com sucesso.")

				handleClose()
				onSuccess()
				return
			}

			await FinanceService.create(type, data)

			toast.success("Finança cadastrada com sucesso.")

			handleClose()

			onSuccess()
		} catch (error: unknown) {
			if (isApiError(error)) {
				toast.error(error.message)
			}
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		form.reset(getDefaultValues())
		setFinanceId(undefined)
		setOpen(false)
	}

	useEffect(() => {
		const loadCategories = async () => {
			setCategories([])

			try {
				const response = await FinanceService.listCategories()

				setCategories(
					response.filter((category) => category.type === type)
				)
			} catch (error) {
				const message = isApiError(error)
					? error.message
					: "Erro desconhecido ao listar categorias"

				toast.error(message)
			}
		}

		loadCategories()
	}, [type])

	useEffect(() => {
		if (financeId) {
			const loadFinance = async () => {
				const response = await FinanceService.retrieve(type, financeId)
	
				setFinance(response)
	
				form.reset({
					amount: response.amount,
					date: parseISO(response.date),
					category: response.category.id,
					description: response.description,
				})
			}
	
			loadFinance()	
			return
		}
		
		form.reset((getDefaultValues()))
	}, [financeId, form, type])

	return {
		form,
		onSubmit,
		loading,
		handleClose,
		categoryOptions,
		finance,
	}
}