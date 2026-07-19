"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ProtectedRouteProps } from "@/src/types"
import { hasPermission } from "@/src/lib/auth/permissions"
import Loading from "@/src/app/loading"
import { useAuth } from "@/src/features/auth/context/AuthProvider"

export default function ProtectedRoute({
	role = undefined,
	children,
}: ProtectedRouteProps) {
	const { isLoggedIn, authLoading, logout, user } = useAuth()
	const router = useRouter()

	useEffect(() => {

		if (authLoading) return

		if (!isLoggedIn) {
			router.replace("/login")
			return
		}

		if (!role) return;

		const userRole = user?.function

		if (!userRole) {
			// logout()
			return
		}

		if (!hasPermission(userRole, role)) {
			router.replace("/unauthorized")
		}

	}, [
		authLoading,
		isLoggedIn,
		role,
		router,
		user,
		logout,
	]);

	if (authLoading) {
		return <Loading />
	}

	if (!isLoggedIn) {
		return null
	}

	return children
}