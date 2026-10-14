import { zodResolver } from "@hookform/resolvers/zod"
import { format, parseISO } from "date-fns"
import { useEffect, useState } from "react"
import { Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useAuth } from "@/src/components/providers/AuthProvider"
import { applyApiValidationErrors, isApiError } from "@/src/lib/utils"
import { CategoryProps, PendingProps, SelectOption } from "@/src/types"
import { FinanceService } from "../../finance/services/financial.service"
import { importsApi, notifyPendingChanged } from "../infra/imports"
import {
	BulkRegisterSchema,
	RegisterPendingFormType,
	RegisterPendingSchema,
} from "../schemas/register.schema"

interface Props {
	// Uma pendência (edita valor, data e descrição) ou várias (só família e categoria).
	pending?: PendingProps
	ids?: number[]
	onClose: () => void
	onSuccess: () => void
}

export const useRegisterPendingDialog = ({ pending, ids, onClose, onSuccess }: Props) => {
	const { user } = useAuth()
	const bulk = !pending
	const [loading, setLoading] = useState(false)
	const [categories, setCategories] = useState<CategoryProps[]>([])

	const form = useForm<RegisterPendingFormType>({
		resolver: zodResolver(bulk ? BulkRegisterSchema : RegisterPendingSchema) as unknown as Resolver<RegisterPendingFormType>,
		defaultValues: {
			family: user?.current_family?.id,
			category: undefined,
			amount: pending ? Number(pending.amount) : 0,
			date: pending ? parseISO(pending.occurred_at) : new Date(),
			description: pending?.description ?? "",
		},
	})

	useEffect(() => {
		FinanceService.listCategories()
			.then((response) => setCategories(response.filter((category) => category.type === "EXPENSE")))
			.catch((error) => toast.error(isApiError(error) ? error.message : "Erro ao listar categorias"))
	}, [])

	const categoryOptions: SelectOption<number>[] = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}))

	const familyOptions: SelectOption<number>[] = (user?.families ?? []).map((family) => ({
		label: family.name,
		value: family.id,
	}))

	const onSubmit = async (data: RegisterPendingFormType) => {
		setLoading(true)

		try {
			if (pending) {
				await importsApi.register(pending.id, {
					family: data.family,
					category: data.category,
					amount: data.amount.toFixed(2),
					date: format(data.date, "yyyy-MM-dd"),
					description: data.description ?? "",
				})
				toast.success("Despesa registrada.")
			} else {
				const processed = await importsApi.bulk(ids ?? [], "import", {
					family: data.family,
					category: data.category,
				})
				toast.success(`${processed} despesa(s) registrada(s).`)
			}

			notifyPendingChanged()
			onSuccess()
			onClose()
		} catch (error) {
			if (!isApiError(error)) return

			if (applyApiValidationErrors(form, error)) return

			toast.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	return { form, bulk, loading, onSubmit, categoryOptions, familyOptions }
}
