"use client"

import ProtectedRoute from "@/src/components/auth/ProtectedRoute"
import { CategoryScreen } from "@/src/features/category/components/CategoryScreen"
import { UserRole } from "@/src/types"

export default function CategoryPage() {
	return (
		<ProtectedRoute
			role={[UserRole.ADMIN, UserRole.OWNER]}
		>
			<CategoryScreen />
		</ProtectedRoute>
	)
}