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
		<section className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Famílias"
					subtitle="Veja as famílias de que você participa e escolha qual está usando."
				/>

				<Button
					onClick={() => setOpen(true)}
					className="h-10 gap-2"
				>
					<Plus className="size-4" />
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
