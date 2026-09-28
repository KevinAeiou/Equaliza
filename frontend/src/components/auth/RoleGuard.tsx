"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../providers/AuthProvider"
import { UserRole } from "@/src/types"
import { useEffect } from "react"
import Loading from "@/src/app/loading"

export function RoleGuard({
	role,
	children,
}: {
	role: UserRole[]
	children: React.ReactNode
}) {
	const { authLoading, user } = useAuth()
	const router = useRouter()

	const hasPermission = role.includes(user.role)

	useEffect(() => {
		if (authLoading) return

		if (!hasPermission) {
			router.replace("/unauthorized")
		}
	}, [authLoading, hasPermission, router])

	if (authLoading) {
		return <Loading />
	}

	if (!hasPermission) {
		return null
	}

	return children
}