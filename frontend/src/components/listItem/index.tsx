import Link from "next/link"
import { NavigationMenuLink } from "../ui/navigation-menu"
import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"

interface ListItemProps {
	title: string
	children?: ReactNode
	href?: string
	onClick?: () => void
	icon?: LucideIcon
}

export const ListItem = ({
	title,
	children,
	href,
	onClick,
	icon: Icon,
}: ListItemProps) => {
	const content = (
		<div className="flex items-center min-h-2 text-sm gap-2">
			{Icon && (
				<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
			)}

			<div className="flex flex-col gap-1">
				<div className="leading-none font-medium">
					{title}
				</div>

				<div className="line-clamp-2 text-muted-foreground">
					{children}
				</div>
			</div>
		</div>
	)

	return (
		<li>
			<NavigationMenuLink
				render={
					href ? (
						<Link href={href}>
							{content}
						</Link>
					) : (
						<button
							type="button"
							onClick={onClick}
							className="w-full text-left"
						>
							{content}
						</button>
					)
				}
			/>
		</li>
	)
}