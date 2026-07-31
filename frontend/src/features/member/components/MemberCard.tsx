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
		<Card className="flex h-full flex-col overflow-hidden">
			<CardContent className="flex flex-1 min-h-0 flex-col px-6 pt-0">
				<DataTable
					table={table}
					loading={loading}
					emptyMessage="Nenhum membro da família encontrado."
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