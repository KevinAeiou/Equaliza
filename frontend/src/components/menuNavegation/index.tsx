"use client"

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger
} from "@/src/components/ui/navigation-menu"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from "@/src/components/ui/select"
import { ListItem } from "@/src/components/listItem"
import { useMenuNavegation } from "./useMenuNavegation"
import { InviteDialog } from "@/src/features/invitation/components/InviteDialog"

export const MenuNavegation = () => {
	const {
		families,
		selectedFamily,
		handleFamilyChange,
		canInvite,
		showInviteDialog, setShowInviteDialog,
	} = useMenuNavegation()

	return (
		<NavigationMenu>
			<NavigationMenuList className="flex gap-2">
				<Select
					items={families}
					value={selectedFamily?.id.toString() ?? ""}
					onValueChange={handleFamilyChange}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Selecione uma família" />
					</SelectTrigger>

					<SelectContent>
						<SelectGroup>
							<SelectLabel>Família atual</SelectLabel>

							{families.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>

				<NavigationMenuItem>
					<NavigationMenuTrigger>Home</NavigationMenuTrigger>

					<NavigationMenuContent>
						<ul className="w-56 p-2 space-y-1">
							<ListItem
								title="Dashboard"
								href="/"
							/>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				{canInvite && (
					<NavigationMenuItem>
						<NavigationMenuTrigger>Convites</NavigationMenuTrigger>

						<NavigationMenuContent>
							<ul className="w-56 p-2 space-y-1">
								<ListItem
									title="Visualizar convites"
									href="/invitation"
								/>

								<ListItem
									title="Novo convite"
									onClick={() => setShowInviteDialog(true)}
								/>
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>
				)}

				{canInvite && (
					<NavigationMenuItem>
						<NavigationMenuTrigger>Membros</NavigationMenuTrigger>

						<NavigationMenuContent>
							<ul className="w-56 p-2 space-y-1">
								<ListItem
									title="Visualizar membros"
									href="/member"
								/>
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>
				)}

				<NavigationMenuItem>
					<NavigationMenuTrigger>Finanças</NavigationMenuTrigger>

					<NavigationMenuContent>
						<ul className="w-56 p-2 space-y-1">
							<ListItem
								title="Visualizar finanças"
								href="/finance"
							/>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>

			<InviteDialog
				open={showInviteDialog}
				setOpen={setShowInviteDialog}
			/>
		</NavigationMenu>
	)
}