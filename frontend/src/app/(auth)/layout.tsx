"use client"

import PublicRoute from "@/src/components/auth/PublicRoute"


export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<PublicRoute>
			{children}
		</PublicRoute>
	);
}