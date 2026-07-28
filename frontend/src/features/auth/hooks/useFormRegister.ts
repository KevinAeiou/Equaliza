"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { FormRegisterSchema } from "../schemas/register.shema"
import { FormRegisterShemaType } from "@/src/types"
import { useAuth } from "../../../components/providers/AuthProvider"
import { useRouter, useSearchParams } from "next/navigation"
import { isApiError } from "@/src/lib/utils"


export function useFormRegister() {
	const router = useRouter()

	const [loading, setLoading] = useState(false)

	const { register, validateInvitation } = useAuth()
	const searchParams = useSearchParams()

	const token = searchParams.get("token")
	const invitationMode = !!token

	const form = useForm<FormRegisterShemaType>({
		resolver: zodResolver(FormRegisterSchema),
		defaultValues: {
			first_name: "",
			last_name: "",
			family_name: "",
			email: "",
			password: "",
			passwordConfirmation: "",
		},
	})

	const onSubmit = async (data: FormRegisterShemaType) => {
		setLoading(true)

		try {
			await register({
				...data,
				...(token ? { token } : {}),
			})

			form.reset()
			router.replace(`/`)
		} catch (error: unknown) {
			if (isApiError(error)) {
				form.setError("email", {
					type: "server",
					message: error.message,
				})
			}
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		async function loadInvitation() {
			if (!token) return

			try {

				const invitation = await validateInvitation(token)

				form.reset({
					family_name: invitation.family.name,
					email: invitation.email,
				})

			} catch (error: unknown) {
				const message = isApiError(error) ? error.message : `Convite inválido`

				router.replace(`/invitation/invalid?reason=${message}`)
			}

		}

		loadInvitation()
	}, [form, router, token, validateInvitation])

	return {
		form,
		onSubmit,
		loading,
		invitationMode,
	}
}