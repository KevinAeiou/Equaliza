"use client"

import { FormLoginSchemaType } from "@/src/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { FormLoginSchema } from "../schemas/login.shema"
import { isApiError } from "@/src/lib/utils"
import { useAuth } from "../../../components/providers/AuthProvider"

export const useFormLogin = () => {
	const router = useRouter()

	const [loading, setLoading] = useState<boolean>(false)

	const { login } = useAuth()

	const form = useForm<FormLoginSchemaType>({
		resolver: zodResolver(FormLoginSchema),
		defaultValues: {
			email: ``,
			password: ``,
		}
	})

	const onSubmit = async (data: FormLoginSchemaType) => {
		setLoading(true)

		try {
			await login(data)
			form.reset()
			router.replace(`/`)
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
	}
}