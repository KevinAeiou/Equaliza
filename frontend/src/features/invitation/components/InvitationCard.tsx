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
		<Card className="flex flex-1 flex-col overflow-hidden">
			<CardContent>
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhum convite encontrado."
				/>
			</CardContent>
		</Card>
	)
}