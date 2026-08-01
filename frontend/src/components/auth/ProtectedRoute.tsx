"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ProtectedRouteProps } from "@/src/types"
import Loading from "@/src/app/loading"
import { useAuth } from "@/src/components/providers/AuthProvider"

export default function ProtectedRoute({
	children,
	role,
}: ProtectedRouteProps) {
	const { user, isLoggedIn, logout, authLoading } = useAuth()

	const router = useRouter()

	useEffect(() => {
		if (authLoading) return

		if (!isLoggedIn) {
			router.replace("/login")
			return
		}
	}, [authLoading, isLoggedIn, logout, router]);

	if (role && !role.includes(user.role)) {
		router.replace("/unauthorized")
		return
	}

	if (authLoading) {
		return <Loading />
	}

	if (!isLoggedIn) {
		return null
	}

	return children
}