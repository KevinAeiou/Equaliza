"use client"

import ProtectedRoute from "@/src/components/auth/ProtectedRoute"
import { HeaderApp } from "@/src/components/headerApp"

export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<main className="flex h-screen flex-col bg-muted/30 px-4">
			<ProtectedRoute>
				<HeaderApp />

				<div className="flex-1 overflow-auto px-4 py-4">
					{children}
				</div>
			</ProtectedRoute>
		</main>
	)
}