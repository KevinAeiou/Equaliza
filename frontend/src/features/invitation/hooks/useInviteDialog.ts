import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormInvitationSchema, FormInvitationSchemaType, getDefaultValues } from "../../member/schemas/invitation.schema"
import { useState } from "react"
import { applyApiValidationErrors, isApiError } from "@/src/lib/utils"
import { toast } from "sonner"
import { invitationApi } from "../infra/invite"

interface UseInviteDialogProps {
	setOpen: (value: boolean) => void
	onSuccess: () => void
}

export const useInviteDialog = ({
	setOpen,
	onSuccess,
}: UseInviteDialogProps) => {
	const [loading, setLoading] = useState<boolean>(false)


	const form = useForm<FormInvitationSchemaType>({
		resolver: zodResolver(FormInvitationSchema),
		defaultValues: getDefaultValues()
	})

	const onSubmit = async (data: FormInvitationSchemaType) => {
		setLoading(true)

		try {
			const response = await invitationApi.create(data.email)

			toast.success(response.message ?? `Convite criado com sucesso!`)

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
	}

	return {
		form,
		onSubmit,
		loading,
		handleClose,
	}
}