import { DataTable } from "@/src/components/dataTable"
import { Card, CardContent } from "@/src/components/ui/card"
import { useMemberCard } from "../hooks/useMemberCard"
import { AlertDialogDestructive } from "./AlertDialog"


export const MemberCard = () => {
	const {
		table,
		loading,
		open,
		handleOnDelete,
		handleOnClose,
	} = useMemberCard()

	return (
		<Card className="flex flex-1 flex-col overflow-hidden">
			<CardContent className="flex-1 overflow-hidden p-0">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhum convite encontrado."
				/>
			</CardContent>

			<AlertDialogDestructive
				open={open}
				handleOnDelete={handleOnDelete}
				handleOnClose={handleOnClose}
			/>
		</Card>
	)
}