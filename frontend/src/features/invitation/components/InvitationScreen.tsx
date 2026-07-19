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
	} = useInvitationScreen()

	return (
		<section className="flex h-full flex-col gap-4">
			<HeaderScreen
				title="Convites"
				subtitle="Gerencie os convites enviados para sua família."
			>
				<Button
					onClick={() => setOpen(true)}
				>
					<Plus className="mr-2 h-4 w-4" />
					Novo convite
				</Button>
			</HeaderScreen>

			<InvitationCard />
			
			<InviteDialog
				open={open}
				setOpen={setOpen}
			/>
		</section>
	)
}