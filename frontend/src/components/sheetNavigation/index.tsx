"use client"

import Link from "next/link"
import { Menu, Home, Wallet, Users, Mail, LogOut, PencilSparklesIcon } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/src/components/ui/sheet"

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/src/components/ui/select"

import { Separator } from "@/src/components/ui/separator"

import { InviteDialog } from "@/src/features/invitation/components/InviteDialog"

import { useMenuNavegation } from "../menuNavegation/useMenuNavegation"
import { useUserNavigation } from "../userNavegation/useUserNavigation"
import { useSheetNavigation } from "./useSheetNavigation"
import { ProfileDialog } from "../profileDialog"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Field, FieldLabel } from "../ui/field"

export const SheetNavigation = () => {
	const {
		families,
		selectedFamily,
		handleFamilyChange,
		canInvite,
		showInviteDialog,
		setShowInviteDialog,
	} = useMenuNavegation()

	const {
		user,
		avatar,
		handleLogout,
		setShowProfile,
		showProfile,
	} = useUserNavigation()

	const {
		open, setOpen,
		handleClose,
	} = useSheetNavigation()

	return (
		<>
			<Sheet
				open={open}
				onOpenChange={setOpen}
			>
				<SheetTrigger>
					<Menu />
				</SheetTrigger>

				<SheetContent
					side="left"
					className="w-full rounded-r-xl sm:max-w-md"
				>
					<SheetHeader className="border-b pb-5">
						<div className="flex items-center gap-3">
							<Image
								src="/logo-icon.svg"
								alt="Equaliza"
								width={42}
								height={42}
								className="block dark:hidden transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-sm"

							/>

							<Image
								src="/logo-icon-white.svg"
								alt="Equaliza"
								width={42}
								height={42}
								className="hidden dark:block transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-sm"
							/>

							<div>
								<SheetTitle>Equaliza</SheetTitle>

								<p className="text-sm text-muted-foreground">
									Organize suas finanças
								</p>
							</div>
						</div>
					</SheetHeader>

					<div className="flex flex-1 flex-col gap-4 py-6 px-4">
						<Field>
							<FieldLabel htmlFor="family">Família</FieldLabel>

							<Select
								id="family"
								items={families}
								value={selectedFamily?.id.toString() ?? ""}
								onValueChange={handleFamilyChange}
								disabled={families.length === 0}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={families.length === 0
											? "Nenhuma família cadastrada"
											: "Selecione uma família"
										}
									/>
								</SelectTrigger>

								<SelectContent>
									<SelectGroup>
										<SelectLabel>Família atual</SelectLabel>

										{families.length === 0 ? (
											<SelectItem value="empty" disabled>
												Nenhuma família cadastrada
											</SelectItem>
										) : (
											families.map((item) => (
												<SelectItem key={item.value} value={item.value}>
													{item.label}
												</SelectItem>
											))
										)}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>

						<Separator />

						<nav className="flex flex-col gap-2">

							<Button
								variant="ghost"
								className="justify-start"
								onClick={handleClose}
							>
								<Link
									className="flex"
									href="/"
								>
									<Home className="mr-2 h-4 w-4" />
									Dashboard
								</Link>
							</Button>

							<Button
								variant="ghost"
								className="justify-start"
								onClick={handleClose}
							>
								<Link
									className="flex"
									href="/finance"
								>
									<Wallet className="mr-2 h-4 w-4" />
									Finanças
								</Link>
							</Button>

							{canInvite && (
								<>
									<Button
										variant="ghost"
										className="justify-start"
										onClick={handleClose}
									>
										<Link
											className="flex"
											href="/member"
										>
											<Users className="mr-2 h-4 w-4" />
											Membros
										</Link>
									</Button>

									<Button
										variant="ghost"
										className="justify-start"
										onClick={handleClose}
									>
										<Link
											className="flex"
											href="/invitation"
										>
											<Mail className="mr-2 h-4 w-4" />
											Convites
										</Link>
									</Button>
								</>
							)}
						</nav>
					</div>

					<SheetFooter>
						<Separator className="my-2" />

						<Button
							variant="ghost"
							className="h-auto w-full justify-start p-3"
							onClick={() => {
								setShowProfile(true)
								handleClose()
							}}
						>
							<div className="flex w-full items-center gap-3">
								<Avatar>
									<AvatarImage src={avatar?.image} />

									<AvatarFallback>
										{`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`}
									</AvatarFallback>
								</Avatar>

								<div className="min-w-0 flex-1 text-left">
									<p className="truncate text-sm font-medium">
										{user.first_name}
									</p>

									<p className="truncate text-xs text-muted-foreground">
										{user.role}
									</p>
								</div>

								<PencilSparklesIcon className="h-4 w-4 text-muted-foreground" />
							</div>
						</Button>


						<Button
							variant="ghost"
							className="justify-start text-destructive hover:text-destructive"
							onClick={handleLogout}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Sair
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<InviteDialog
				open={showInviteDialog}
				setOpen={setShowInviteDialog}
			/>

			<ProfileDialog
				open={showProfile}
				onOpenChange={setShowProfile}
			/>
		</>
	)
}