import Image from "next/image"
import Link from "next/link"

import { UserNavegation } from "@/src/components/userNavegation"
import { MenuNavegation } from "../menuNavegation"

export const HeaderApp = () => {
	return (
		<header className="flex w-full shrink-0 items-center justify-between gap-2 px-4 py-2">
			<Link
				href="/"
				className="group flex items-center rounded-lg p-2 transition-all duration-300 hover:bg-muted/40"
			>
				<Image
					src="/logo.svg"
					alt="Equaliza"
					width={180}
					height={48}
					className="transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-sm"
					priority
				/>
			</Link>

			<MenuNavegation />

			<UserNavegation />
		</header>
	)
}