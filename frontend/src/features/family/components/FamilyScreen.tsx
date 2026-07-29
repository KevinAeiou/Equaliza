import { HeaderScreen } from "@/src/components/headerScreen"
import { Button } from "@/src/components/ui/button"
import { Plus } from "lucide-react"
import { useFamilyScreen } from "../hooks/useFamilyScreen"
import { FamilyCard } from "./FamilyCard"
import { FamilyDialog } from "./FamilyDialog"

export const FamilyScreen = () => {
	const {
		open, setOpen,
		refresh, setRefresh,
		selectedFamily, setSelectedFamily,
	} = useFamilyScreen()

	return (
		<section className="flex h-full flex-col gap-2">
			<HeaderScreen
				title="Famílias"
				subtitle="Gerencie suas famílias registradas."
			></HeaderScreen>

			<div className="flex justify-end w-full">
				<Button
					onClick={() => setOpen(true)}
				>
					<Plus className="mr-2 h-4 w-4" />
					Nova família
				</Button>
			</div>

			<FamilyCard
				refresh={refresh}
				setOpen={setOpen}
				setSelectedFamily={setSelectedFamily}
			/>

			<FamilyDialog
				open={open}
				setOpen={setOpen}
				selectedFamily={selectedFamily}
				setSelectedFamily={setSelectedFamily}
				onSuccess={() => setRefresh((v) => v + 1)}
			/>
		</section>
	)
}