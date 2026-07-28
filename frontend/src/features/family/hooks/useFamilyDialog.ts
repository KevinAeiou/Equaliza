import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { FamilyService } from "../services/family.service"
import { isApiError } from "@/src/lib/utils"
import { toast } from "sonner"
import { FormFamilySchema, FormFamilySchemaType, getDefaultValues } from "../schemas/family.shema"
import { FamilyProps } from "@/src/types"
import { useAuth } from "../../../components/providers/AuthProvider"

interface UseFamilyDialog {
	setOpen: (value: boolean) => void
	onSuccess: () => void
	selectedFamily?: FamilyProps
	setSelectedFamily: (value?: FamilyProps) => void
}

export const useFamilyDialog = ({
	setOpen,
	onSuccess,
	selectedFamily,
	setSelectedFamily,
}: UseFamilyDialog) => {
	const [loading, setLoading] = useState<boolean>(false)

	const {
		refreshUser,
	} = useAuth()

	const form = useForm<FormFamilySchemaType>({
		resolver: zodResolver(FormFamilySchema),
		defaultValues: getDefaultValues()
	})

	const onSubmit = async (data: FormFamilySchemaType) => {
		setLoading(true)

		try {
			if (selectedFamily) {
				await FamilyService.update(selectedFamily.id, data)

				toast.success(`Família atualizada com sucesso.`)

				handleClose()

				onSuccess()

				await refreshUser()
				return
			}

			await FamilyService.create(data)

			toast.success(`Família criada com sucesso!`)

			handleClose()

			onSuccess()

			await refreshUser()
		} catch (error: unknown) {
			if (isApiError(error)) {
				form.setError("name", {
					type: "server",
					message: error.message,
				})
			}
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		form.reset(getDefaultValues())
		setOpen(false)
		setSelectedFamily(undefined)
	}

	useEffect(() => {
		if (selectedFamily) {
			form.reset({
				name: selectedFamily.name,
			})

			return
		}

		form.reset(getDefaultValues())
	}, [selectedFamily, form])
	return {
		form,
		onSubmit,
		loading,
		handleClose,
	}
}