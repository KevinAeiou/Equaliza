"use client"

import { useInvitationCard } from "../hooks/useInvitationCard"
import { Card, CardContent } from "@/src/components/ui/card"
import { DataTable } from "@/src/components/dataTable"

interface InvitationCardProps {
	refresh: number
}

export const InvitationCard = ({
	refresh,
}: InvitationCardProps) => {
	const {
		table,
		loading,
	} = useInvitationCard({ refresh })

	return (
		<Card className="flex flex-col overflow-hidden">
			<CardContent className="flex flex-1 min-h-0 flex-col px-6 pt-0">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhum convite encontrado."
				/>
			</CardContent>
		</Card>
	)
}