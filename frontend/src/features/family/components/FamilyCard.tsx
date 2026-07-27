import { Card, CardContent } from "@/src/components/ui/card"
import { useFamilyCard } from "../hooks/useFamilyCard"
import { DataTable } from "@/src/components/dataTable"
import { FamilyProps } from "@/src/types"

interface FamilyCardProps {
	refresh: number
	setOpen: (value: boolean) => void
	setSelectedFamily: (family: FamilyProps) => void
}

export const FamilyCard = ({
	refresh,
	setOpen,
	setSelectedFamily,
}: FamilyCardProps) => {
	const {
		table,
		loading,
	} = useFamilyCard({ refresh, setOpen, setSelectedFamily })

	return (
		<Card>
			<CardContent>
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhuma família encontrada."
				/>
			</CardContent>
		</Card>
	)
}