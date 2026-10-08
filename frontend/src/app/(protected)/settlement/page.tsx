"use client"

import { Suspense } from "react"
import { SettlementScreen } from "@/src/features/settlement/components/SettlementScreen"

export default function SettlementPage() {
	return (
		<Suspense>
			<SettlementScreen />
		</Suspense>
	)
}
