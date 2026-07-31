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
		<Card className="flex h-full flex-col overflow-hidden">
			<CardContent className="flex flex-1 min-h-0 flex-col px-6 pt-0">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhuma família encontrada."
				/>
			</CardContent>
		</Card>
	)
}