import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormInvitationSchema, FormInvitationSchemaType, getDefaultValues } from "../../member/schemas/invitation.schema"
import { useState } from "react"
import { isApiError } from "@/src/lib/utils"
import { toast } from "sonner"
import { invitationApi } from "../infra/invite"


export const useInviteDialog = (
	setOpen: (value: boolean) => void
) => {
	const [loading, setLoading] = useState<boolean>(false)


	const form = useForm<FormInvitationSchemaType>({
		resolver: zodResolver(FormInvitationSchema),
		defaultValues: getDefaultValues()
	})

	const onSubmit = async (data: FormInvitationSchemaType) => {
		setLoading(true)

		try {
			const response = await invitationApi.create(data.email)
			form.reset()

			toast.success(response.message ?? `Convite criado com sucesso!`)
			setOpen(false)
		} catch (error: unknown) {
			if (isApiError(error)) {
				form.setError("email", {
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
	}

	return {
		form,
		onSubmit,
		loading,
		handleClose,
	}
}