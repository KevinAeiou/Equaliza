"use client"

import { AuthenticatedRoute } from "@/src/components/auth/AuthenticatedRoute"
import { HeaderApp } from "@/src/components/headerApp"

export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<main className="flex h-screen flex-col bg-muted/30">
			<AuthenticatedRoute>
				<HeaderApp />

				<div className="flex-1 overflow-auto px-4 py-6 sm:px-8">
					{children}
				</div>
			</AuthenticatedRoute>
		</main>
	)
}