"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/src/components/providers/AuthProvider"
import { isApiError } from "@/src/lib/utils"
import { InviteValidationProps } from "@/src/types"
import { invitationApi } from "../infra/invite"

export const useAcceptInvitation = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const token = searchParams.get("token")

	const { isLoggedIn, authLoading, user, refreshUser } = useAuth()

	const [invitation, setInvitation] = useState<InviteValidationProps["family"] | null>(null)
	const [invitedEmail, setInvitedEmail] = useState<string | null>(null)
	const [loading, setLoading] = useState<boolean>(true)
	const [accepting, setAccepting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!token) {
			router.replace("/invitation/invalid?reason=Convite não encontrado.")
			return
		}

		const loadInvitation = async () => {
			try {
				const response = await invitationApi.validate(token)

				setInvitation(response.data.family)
				setInvitedEmail(response.data.email)
			} catch (error: unknown) {
				const message = isApiError(error) ? error.message : "Convite inválido"

				router.replace(`/invitation/invalid?reason=${encodeURIComponent(message)}`)
			} finally {
				setLoading(false)
			}
		}

		void loadInvitation()
	}, [token, router])

	const accept = useCallback(async () => {
		if (!token) return

		setAccepting(true)
		setError(null)

		try {
			const family = await invitationApi.accept(token)

			await refreshUser()

			toast.success(`Você entrou na família ${family.name}!`)
			router.replace("/dashboard")
		} catch (error: unknown) {
			setError(isApiError(error) ? error.message : "Não foi possível aceitar o convite.")
		} finally {
			setAccepting(false)
		}
	}, [token, refreshUser, router])

	const next = encodeURIComponent(`/invitation/accept?token=${token}`)

	return {
		token,
		invitation,
		invitedEmail,
		loading: loading || authLoading,
		accepting,
		error,
		isLoggedIn,
		userEmail: user.email,
		loginHref: `/login?next=${next}`,
		registerHref: `/register?token=${token}`,
		accept,
	}
}
