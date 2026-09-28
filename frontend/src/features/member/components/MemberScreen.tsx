"use client"

import { UserPlus } from "lucide-react"
import Link from "next/link"
import { HeaderScreen } from "@/src/components/headerScreen"
import { buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"
import { MemberCard } from "./MemberCard"

export const MemberScreen = () => {

	return (
		<section className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Membros"
					subtitle="Gerencie quem participa das finanças da sua família."
				/>

				<Link
					href="/invitation"
					className={cn(buttonVariants(), "h-10 gap-2")}
				>
					<UserPlus className="size-4" />
					Convidar membro
				</Link>
			</div>

			<MemberCard />
		</section>
	)
}
