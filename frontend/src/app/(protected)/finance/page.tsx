"use client"

import { Suspense } from "react"
import { FinanceScreen } from "@/src/features/finance/components/FinanceScreen"

export default function FinancePage() {
	return (
		<Suspense>
			<FinanceScreen />
		</Suspense>
	)
}