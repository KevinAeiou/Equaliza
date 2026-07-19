"use client"

import { useInvitationCard } from "../hooks/useInvitationCard"
import { Card, CardContent } from "@/src/components/ui/card"
import { DataTable } from "@/src/components/dataTable"

export const InvitationCard = () => {
	const {
		table,
		loading,
	} = useInvitationCard()

	return (
		<Card className="flex flex-1 flex-col overflow-hidden">
			<CardContent className="flex-1 overflow-hidden p-0">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhum convite encontrado."
				/>
			</CardContent>
		</Card>
	)
}