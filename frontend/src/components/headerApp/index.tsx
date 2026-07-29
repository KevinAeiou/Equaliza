import Image from "next/image"
import Link from "next/link"

import { UserNavegation } from "@/src/components/userNavegation"
import { MenuNavegation } from "../menuNavegation"
import { SheetNavigation } from "../sheetNavigation"

export const HeaderApp = () => {
	return (
		<header className="flex w-full items-center justify-end gap-2 px-4 py-2">
			<div className="w-full hidden md:flex items-center justify-between gap-2">
				<Link
					href="/"
					className="group flex items-center rounded-lg p-2 transition-all duration-300 hover:bg-muted/40"
				>
					<Image
						src="/logo.svg"
						alt="Equaliza"
						width={180}
						height={48}
						className="block dark:hidden transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-sm"
						priority
					/>

					<Image
						src="/logo-white.svg"
						alt="Equaliza"
						width={180}
						height={48}
						className="hidden dark:block transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-sm"
						priority
					/>
				</Link>

				<MenuNavegation />

				<UserNavegation />
			</div>

			<div className="flex md:hidden">
				<SheetNavigation />
			</div>
		</header>
	)
}