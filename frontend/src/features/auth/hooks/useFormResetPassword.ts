"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { isApiError } from "@/src/lib/utils"
import {
	FormResetPasswordSchema,
	FormResetPasswordSchemaType,
} from "../schemas/password-reset.schema"
import { AuthService } from "../services/auth.service"

export const useFormResetPassword = () => {
	const router = useRouter()
	const searchParams = useSearchParams()

	const uid = searchParams.get("uid")
	const token = searchParams.get("token")

	const [loading, setLoading] = useState<boolean>(false)

	const form = useForm<FormResetPasswordSchemaType>({
		resolver: zodResolver(FormResetPasswordSchema),
		defaultValues: {
			password: ``,
			passwordConfirmation: ``,
		}
	})

	const onSubmit = async (data: FormResetPasswordSchemaType) => {
		if (!uid || !token) {
			return
		}

		setLoading(true)

		try {
			await AuthService.confirmPasswordReset(uid, token, data.password)
			toast.success("Senha redefinida com sucesso! Faça login com a nova senha.")
			router.replace(`/login`)
		} catch (error: unknown) {
			if (isApiError(error)) {
				form.setError("password", {
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
		form,
		validLink: Boolean(uid && token),
	}
}
