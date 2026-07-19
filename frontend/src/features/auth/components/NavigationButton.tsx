"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/src/components/ui/button"

interface NavigationButtonProps {
	href: string
	children: React.ReactNode
}

export function NavigationButton({
	href,
	children,
}: NavigationButtonProps) {
	const router = useRouter()

	const [loading, setLoading] = useState(false)

	function handleClick() {
		if (loading) {
			return
		}

		setLoading(true)

		router.replace(href)
	}


	return (
		<Button
			variant="link"
			onClick={handleClick}
			disabled={loading}
		>
			{children}
		</Button>
	)
}