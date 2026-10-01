"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import Loading from "@/src/app/loading"
import { useAuth } from "@/src/components/providers/AuthProvider"


export default function PublicRoute({
	children,
}: {
	children: React.ReactNode
}) {
	const { isLoggedIn, authLoading } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()

	// Só aceita caminhos internos, para evitar redirecionamento aberto.
	const next = searchParams.get("next")
	const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : `/`

	useEffect(() => {
		if (!authLoading && isLoggedIn) {
			router.replace(destination)
		}
	}, [authLoading, isLoggedIn, router, destination])

	if (authLoading) {
		return <Loading />
	}

	if (isLoggedIn) {
		return null
	}

	return <>{children}</>
}
