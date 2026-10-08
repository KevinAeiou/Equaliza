"use client"

import { Home, LucideIcon, Mail, Tags, Users, UsersRound, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/src/lib/utils"
import { useMenuNavigation } from "./useMenuNavigation"

interface NavLink {
	href: string
	label: string
	icon: LucideIcon
	adminOnly?: boolean
}

// Categorias, Membros e Convites exigem responsável ou administrador (as rotas também são protegidas).
export const NAV_LINKS: NavLink[] = [
	{ href: "/dashboard", label: "Dashboard", icon: Home },
	{ href: "/finance", label: "Finanças", icon: Wallet },
	{ href: "/category", label: "Categorias", icon: Tags, adminOnly: true },
	{ href: "/member", label: "Membros", icon: Users, adminOnly: true },
	{ href: "/invitation", label: "Convites", icon: Mail, adminOnly: true },
	{ href: "/family", label: "Famílias", icon: UsersRound },
]

export const isActiveLink = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`)

export const MenuNavigation = () => {
	const { isAdmin } = useMenuNavigation()
	const pathname = usePathname()

	return (
		<nav aria-label="Navegação principal" className="flex items-center gap-1">
			{NAV_LINKS.filter((link) => !link.adminOnly || isAdmin).map((link) => {
				const active = isActiveLink(pathname, link.href)

				return (
					<Link
						key={link.href}
						href={link.href}
						aria-current={active ? "page" : undefined}
						className={cn(
							"rounded-md px-3 py-2 text-sm font-medium transition-colors",
							active
								? "bg-muted text-foreground"
								: "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
						)}
					>
						{link.label}
					</Link>
				)
			})}
		</nav>
	)
}
