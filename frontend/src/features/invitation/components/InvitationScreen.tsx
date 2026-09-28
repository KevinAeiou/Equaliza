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
		<section className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Convites"
					subtitle="Convide pessoas para a família e acompanhe cada convite."
				/>

				<Button
					onClick={() => setOpen(true)}
					className="h-10 gap-2"
				>
					<Plus className="size-4" />
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
