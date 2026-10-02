"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { isApiError } from "@/src/lib/utils"
import {
	FormForgotPasswordSchema,
	FormForgotPasswordSchemaType,
} from "../schemas/password-reset.schema"
import { AuthService } from "../services/auth.service"

export const useFormForgotPassword = () => {
	const [loading, setLoading] = useState<boolean>(false)
	const [sent, setSent] = useState<boolean>(false)

	const form = useForm<FormForgotPasswordSchemaType>({
		resolver: zodResolver(FormForgotPasswordSchema),
		defaultValues: {
			email: ``,
		}
	})

	const onSubmit = async (data: FormForgotPasswordSchemaType) => {
		setLoading(true)

		try {
			await AuthService.requestPasswordReset(data.email)
			setSent(true)
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

	return {
		onSubmit,
		loading,
		sent,
		form,
	}
}
