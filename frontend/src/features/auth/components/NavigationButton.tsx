"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

interface NavigationButtonProps {
	href: string
	children: React.ReactNode
	className?: string
}

export function NavigationButton({
	href,
	children,
	className,
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
			className={cn("h-auto p-0 font-medium text-income", className)}
			onClick={handleClick}
			disabled={loading}
		>
			{children}
		</Button>
	)
}