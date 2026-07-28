"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/src/components/ui/navigation-menu"
import { ListItem } from "@/src/components/listItem"
import { useUserNavigation } from "./useUserNavigation"
import { LogOut, LucideUser2, Settings } from "lucide-react"
import { UserSettingsSheet } from "../userSettingsSheet"
import { Separator } from "../ui/separator"
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
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>
						<div className="flex items-center gap-3">
							<Avatar className="h-10 w-10">
								<AvatarImage
									src={avatar?.image}
									alt={user.first_name}
									className="object-cover"
								/>

								<AvatarFallback>
									{`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`}
								</AvatarFallback>
							</Avatar>

							<div className="flex flex-col items-start text-left">
								<span className="text-sm font-semibold leading-tight">
									{user.first_name}
								</span>

								<span className="text-xs text-muted-foreground leading-tight">
									{user.role}
								</span>
							</div>
						</div>
					</NavigationMenuTrigger>

					<NavigationMenuContent>
						<ul className="w-56 p-2 space-y-1">
							<ListItem
								icon={LucideUser2}
								title="Perfil"
								onClick={() => setShowProfile(true)}
							/>
							{/* TODO: Implementar menu de configurações e preferencias do sistema */}
							<ListItem
								icon={Settings}
								title="Configurações"
								onClick={() => setShowSettings(true)}
							/>

							<Separator />

							<ListItem
								icon={LogOut}
								title="Sair"
								onClick={handleLogout}
							/>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>

			<UserSettingsSheet
				open={showSettings}
				onOpenChange={setShowSettings}
			/>

			<ProfileDialog
				open={showProfile}
				onOpenChange={setShowProfile}
			/>
		</NavigationMenu>
	)
}