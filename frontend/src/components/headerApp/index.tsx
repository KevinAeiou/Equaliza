import Image from "next/image"
import Link from "next/link"

import { UserNavigation } from "@/src/components/userNavigation"
import { MenuNavigation } from "../menuNavigation"
import { SheetNavigation } from "../sheetNavigation"
import { FamilySwitcher } from "@/src/features/family/components/FamilySwitcher"

const Logo = ({ width, height }: { width: number, height: number }) => (
	<Link
		href="/dashboard"
		aria-label="Equaliza, ir para o dashboard"
		className="flex shrink-0 items-center rounded-lg"
	>
		<Image
			src="/logo.svg"
			alt="Equaliza"
			width={width}
			height={height}
			className="block dark:hidden"
			priority
		/>

		<Image
			src="/logo-white.svg"
			alt="Equaliza"
			width={width}
			height={height}
			className="hidden dark:block"
			priority
		/>
	</Link>
)

export const HeaderApp = () => {
	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/90 px-4 backdrop-blur sm:px-8">
			<div className="mx-auto hidden h-16 w-full max-w-7xl items-center gap-6 lg:flex">
				<div className="flex items-center gap-4">
					<Logo width={132} height={33} />

					<span className="h-6 w-px bg-border" aria-hidden="true" />

					<FamilySwitcher />
				</div>

				<div className="flex flex-1 justify-center">
					<MenuNavigation />
				</div>

				<UserNavigation />
			</div>

			<div className="flex h-14 items-center justify-between lg:hidden">
				<Logo width={116} height={29} />

				<SheetNavigation />
			</div>
		</header>
	)
}
