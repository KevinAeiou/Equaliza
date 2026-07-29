"use client"

import { Plus } from "lucide-react"
import { InvitationCard } from "./InvitationCard"
import { Button } from "@/src/components/ui/button"
import { InviteDialog } from "./InviteDialog"
import { useInvitationScreen } from "../hooks/useInvitationScreen"
import { HeaderScreen } from "@/src/components/headerScreen"

export const InvitationScreen = () => {
	const {
		open, setOpen,
		refresh, setRefresh,
	} = useInvitationScreen()

	return (
		<section className="flex h-full flex-col gap-2">
			<HeaderScreen
				title="Convites"
				subtitle="Gerencie os convites enviados para sua família."
			></HeaderScreen>

			<div className="flex justify-end w-full">
				<Button
					onClick={() => setOpen(true)}
					className="gap-2 w-full sm:w-auto"
				>
					<Plus className="mr-2 h-4 w-4" />
					Novo convite
				</Button>
			</div>

			<InvitationCard
				refresh={refresh}
			/>

			<InviteDialog
				open={open}
				setOpen={setOpen}
				onSuccess={() => setRefresh((v) => v + 1)}
			/>
		</section>
	)
}