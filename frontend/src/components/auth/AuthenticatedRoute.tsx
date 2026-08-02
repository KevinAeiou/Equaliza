"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../providers/AuthProvider"
import { useEffect } from "react"
import Loading from "@/src/app/loading"

export function AuthenticatedRoute({
	children,
}: {
	children: React.ReactNode
}) {
	const { authLoading, isLoggedIn } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (authLoading) return

		if (!isLoggedIn) {
			router.replace("/login")
		}
	}, [authLoading, isLoggedIn, router])

	if (authLoading) {
		return <Loading />
	}

	if (!isLoggedIn) {
		return null
	}

	return children
}