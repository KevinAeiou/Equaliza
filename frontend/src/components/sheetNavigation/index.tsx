"use client"

import { Check, LogOut, Menu, Settings, Settings2, UserRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/src/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/src/components/ui/sheet"
import { getFamilyMonogram } from "@/src/features/dashboard/utils"
import { cn } from "@/src/lib/utils"

import { isActiveLink, NAV_LINKS } from "../menuNavegation"
import { useMenuNavegation } from "../menuNavegation/useMenuNavegation"
import { useUserNavigation } from "../userNavegation/useUserNavigation"
import { useSheetNavigation } from "./useSheetNavigation"
import { ProfileDialog } from "../profileDialog"
import { UserSettingsSheet } from "../userSettingsSheet"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

const SectionTitle = ({ children }: { children: string }) => (
	<span className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{children}
	</span>
)

export const SheetNavigation = () => {
	const {
		families,
		selectedFamily,
		handleFamilyChange,
		isAdmin,
	} = useMenuNavegation()

	const {
		user,
		avatar,
		handleLogout,
		showProfile, setShowProfile,
		showSettings, setShowSettings,
	} = useUserNavigation()

	const {
		open, setOpen,
		handleClose,
	} = useSheetNavigation()

	const pathname = usePathname()

	const rowClassName = "flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors"

	return (
		<>
			<Sheet
				open={open}
				onOpenChange={setOpen}
			>
				<SheetTrigger
					render={<Button variant="ghost" size="icon" className="size-11" aria-label="Abrir menu" />}
				>
					<Menu className="size-5" />
				</SheetTrigger>

				<SheetContent
					side="right"
					className="w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-sm"
				>
					<div className="flex h-14 items-center border-b px-4 pr-14">
						<SheetTitle className="sr-only">Menu</SheetTitle>

						<Image
							src="/logo.svg"
							alt="Equaliza"
							width={116}
							height={29}
							className="block dark:hidden"
						/>

						<Image
							src="/logo-white.svg"
							alt="Equaliza"
							width={116}
							height={29}
							className="hidden dark:block"
						/>
					</div>

					<div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
						<nav aria-label="Navegação principal" className="flex flex-col gap-1">
							<SectionTitle>Navegação</SectionTitle>

							{NAV_LINKS.filter((link) => !link.adminOnly || isAdmin).map(({ href, label, icon: Icon }) => {
								const active = isActiveLink(pathname, href)

								return (
									<Link
										key={href}
										href={href}
										onClick={handleClose}
										aria-current={active ? "page" : undefined}
										className={cn(
											rowClassName,
											active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
										)}
									>
										<Icon className={cn("size-4", active && "text-income")} />
										{label}
									</Link>
								)
							})}
						</nav>

						<div className="flex flex-col gap-1">
							<SectionTitle>Família</SectionTitle>

							{families.length === 0 && (
								<p className="px-3 py-2 text-sm text-muted-foreground">
									Você ainda não participa de nenhuma família.
								</p>
							)}

							{/* Trocar de família com um toque; a atual fica marcada. */}
							<div role="radiogroup" aria-label="Família atual" className="flex flex-col gap-1">
								{families.map((family) => {
									const current = family.value === selectedFamily?.id.toString()

									return (
										<button
											key={family.value}
											type="button"
											role="radio"
											aria-checked={current}
											onClick={() => !current && handleFamilyChange(family.value)}
											className={cn(rowClassName, "text-left", current ? "bg-muted font-medium" : "hover:bg-muted/60")}
										>
											<span
												className={cn(
													"flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
													current ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"
												)}
											>
												{getFamilyMonogram(family.label)}
											</span>

											<span className="flex-1 truncate">{family.label}</span>

											{current && <Check className="size-4 text-income" />}
										</button>
									)
								})}
							</div>

							<Link
								href="/family"
								onClick={handleClose}
								className={cn(rowClassName, "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}
							>
								<Settings2 className="size-4" />
								Gerenciar famílias
							</Link>
						</div>
					</div>

					<div className="flex flex-col gap-3 border-t p-4">
						<div className="flex items-center gap-3">
							<Avatar className="size-10">
								<AvatarImage src={avatar?.image} alt="" className="object-cover" />

								<AvatarFallback>
									{`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`}
								</AvatarFallback>
							</Avatar>

							<div className="flex min-w-0 flex-1 flex-col">
								<span className="truncate text-sm font-medium">
									{[user.first_name, user.last_name].filter(Boolean).join(" ")}
								</span>

								<span className="truncate text-xs text-muted-foreground">
									{user.role ? `${user.role} · ${user.email}` : user.email}
								</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								className="h-10 gap-2"
								onClick={() => {
									setShowProfile(true)
									handleClose()
								}}
							>
								<UserRound className="size-4" />
								Perfil
							</Button>

							<Button
								variant="outline"
								className="h-10 gap-2"
								onClick={() => {
									setShowSettings(true)
									handleClose()
								}}
							>
								<Settings className="size-4" />
								Configurações
							</Button>
						</div>

						<Button
							variant="ghost"
							className="h-10 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={handleLogout}
						>
							<LogOut className="size-4" />
							Sair
						</Button>
					</div>
				</SheetContent>
			</Sheet>

			<ProfileDialog
				open={showProfile}
				onOpenChange={setShowProfile}
			/>

			<UserSettingsSheet
				open={showSettings}
				onOpenChange={setShowSettings}
			/>
		</>
	)
}
