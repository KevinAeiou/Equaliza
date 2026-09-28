"use client"

import { ChevronDown, LogOut, LucideUser2, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { useUserNavigation } from "./useUserNavigation"
import { UserSettingsSheet } from "../userSettingsSheet"
import { ProfileDialog } from "../profileDialog"

export const UserNavegation = () => {
	const {
		user,
		avatar,
		handleLogout,
		showSettings, setShowSettings,
		showProfile, setShowProfile,
	} = useUserNavigation()

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Menu do usuário"
					className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-muted"
				>
					<Avatar className="size-8">
						<AvatarImage
							src={avatar?.image}
							alt=""
							className="object-cover"
						/>

						<AvatarFallback>
							{`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`}
						</AvatarFallback>
					</Avatar>

					<span className="hidden flex-col items-start text-left lg:flex">
						<span className="text-sm leading-tight font-medium">{user.first_name}</span>
						<span className="text-xs leading-tight text-muted-foreground">{user.role}</span>
					</span>

					<ChevronDown className="size-3.5 text-muted-foreground" />
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuGroup>
						<DropdownMenuLabel className="flex flex-col gap-0.5">
							<span className="text-sm font-medium text-foreground">
								{[user.first_name, user.last_name].filter(Boolean).join(" ")}
							</span>
							<span className="truncate text-xs font-normal">{user.email}</span>
						</DropdownMenuLabel>
					</DropdownMenuGroup>

					<DropdownMenuSeparator />

					<DropdownMenuItem onClick={() => setShowProfile(true)}>
						<LucideUser2 className="size-4" />
						Perfil
					</DropdownMenuItem>

					{/* TODO: Implementar menu de configurações e preferencias do sistema */}
					<DropdownMenuItem onClick={() => setShowSettings(true)}>
						<Settings className="size-4" />
						Configurações
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem variant="destructive" onClick={handleLogout}>
						<LogOut className="size-4" />
						Sair
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<UserSettingsSheet
				open={showSettings}
				onOpenChange={setShowSettings}
			/>

			<ProfileDialog
				open={showProfile}
				onOpenChange={setShowProfile}
			/>
		</>
	)
}
