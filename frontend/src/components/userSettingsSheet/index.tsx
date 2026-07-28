"use client"

import { Button } from "@/src/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/src/components/ui/sheet"
import { Separator } from "@/src/components/ui/separator"
import { Field, FieldLabel } from "../ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select"
import { useTheme } from "next-themes"

interface UserSettingsSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UserSettingsSheet = ({
	open,
	onOpenChange,
}: UserSettingsSheetProps) => {
	const { theme, setTheme } = useTheme()

	const themeOptions = [
		{ value: "light", label: "Claro" },
		{ value: "dark", label: "Escuro" },
		{ value: "system", label: "Sistema" },
	]

	return (
		<Sheet
			open={open}
			onOpenChange={onOpenChange}
		>
			<SheetContent className="w-full rounded-l-xl sm:max-w-md">
				<div className="flex h-full flex-col">
					<SheetHeader>
						<SheetTitle>Configurações</SheetTitle>

						<SheetDescription>
							Personalize sua conta e preferências.
						</SheetDescription>
					</SheetHeader>

					<div className="flex-1 space-y-6 px-4 py-6">
						<section className="space-y-4">
							<h3 className="text-sm font-semibold">
								Preferências
							</h3>

							<Field>
								<FieldLabel htmlFor="theme">
									Tema
								</FieldLabel>

								<Select
									id="theme"
									items={themeOptions}
									value={theme}
									onValueChange={(value) => value !== null && setTheme(value)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Selecione um tema" />
									</SelectTrigger>

									<SelectContent>
										<SelectGroup>
											<SelectLabel>Aparência</SelectLabel>

											{themeOptions.map((item) => (
												<SelectItem
													key={item.value}
													value={item.value}
												>
													{item.label}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
						</section>

						<Separator />

						<section className="space-y-3">
							<h3 className="text-sm font-semibold">
								Conta
							</h3>

							<Button
								variant="outline"
								className="w-full justify-start"
							>
								Alterar senha
							</Button>
						</section>
					</div>

					<SheetFooter>
						<Separator className="my-2" />

						<Button
							variant="secondary"
							onClick={() => onOpenChange(false)}
							className="w-full"
						>
							Fechar
						</Button>
					</SheetFooter>
				</div>
			</SheetContent>
		</Sheet>
	)
}