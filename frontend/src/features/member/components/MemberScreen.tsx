"use client"

import { HeaderScreen } from "@/src/components/headerScreen"
import { MemberCard } from "./MemberCard"

export const MemberScreen = () => {

	return (
		<section className="flex h-full flex-col gap-4">
			<HeaderScreen
				title="Membros"
				subtitle="Gerencie os membros da sua família."
			/>

			<MemberCard />
		</section>
	)
}