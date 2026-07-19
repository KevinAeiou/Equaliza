"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Loading from "@/src/app/loading"
import { useAuth } from "@/src/features/auth/context/AuthProvider"


export default function PublicRoute({
	children,
}: {
	children: React.ReactNode
}) {
	const { isLoggedIn, authLoading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!authLoading && isLoggedIn) {
			router.replace(`/`)
		}
	}, [authLoading, isLoggedIn, router])

	if (authLoading) {
		return <Loading />
	}

	if (isLoggedIn) {
		return null
	}

	return <>{children}</>
}