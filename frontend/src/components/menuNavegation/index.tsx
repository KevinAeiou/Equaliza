"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/src/lib/utils"
import { useMenuNavegation } from "./useMenuNavegation"

interface NavLink {
	href: string
	label: string
	adminOnly?: boolean
}

// Categorias, Membros e Convites exigem responsável ou administrador (as rotas também são protegidas).
export const NAV_LINKS: NavLink[] = [
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/finance", label: "Finanças" },
	{ href: "/category", label: "Categorias", adminOnly: true },
	{ href: "/member", label: "Membros", adminOnly: true },
	{ href: "/invitation", label: "Convites", adminOnly: true },
	{ href: "/family", label: "Famílias" },
]

export const MenuNavegation = () => {
	const { isAdmin } = useMenuNavegation()
	const pathname = usePathname()

	return (
		<nav aria-label="Navegação principal" className="flex items-center gap-1">
			{NAV_LINKS.filter((link) => !link.adminOnly || isAdmin).map((link) => {
				const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

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
