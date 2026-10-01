"use client"

import { Suspense } from "react"
import PublicRoute from "@/src/components/auth/PublicRoute"


export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Suspense>
			<PublicRoute>
				{children}
			</PublicRoute>
		</Suspense>
	);
}
