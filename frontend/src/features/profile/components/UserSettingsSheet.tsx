"use client"

import { KeyRound, LucideIcon, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/src/components/ui/sheet"
import { cn } from "@/src/lib/utils"

interface UserSettingsSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const THEME_OPTIONS: { value: string, label: string, icon: LucideIcon }[] = [
	{ value: "light", label: "Claro", icon: Sun },
	{ value: "dark", label: "Escuro", icon: Moon },
	{ value: "system", label: "Sistema", icon: Monitor },
]

const SectionTitle = ({ children }: { children: string }) => (
	<h3 className="text-sm font-semibold">{children}</h3>
)

export const UserSettingsSheet = ({
	open,
	onOpenChange,
}: UserSettingsSheetProps) => {
	const { theme, setTheme } = useTheme()

	return (
		<Sheet
			open={open}
			onOpenChange={onOpenChange}
		>
			{/* data-[side=right]:w-full: sem isso o painel fica com 3/4 da largura no celular. */}
			<SheetContent className="w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
				<SheetHeader className="border-b px-6 py-5 pr-12">
					<SheetTitle className="text-lg font-semibold">Configurações</SheetTitle>

					<SheetDescription>
						Personalize sua conta e suas preferências.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-6">
					<section className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<SectionTitle>Aparência</SectionTitle>
							<p className="text-sm text-muted-foreground">
								&quot;Sistema&quot; acompanha o tema claro ou escuro do seu dispositivo.
							</p>
						</div>

						{/* Opções à vista no lugar de um select, que abria fora do painel no celular. */}
						<div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
							{THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
								const selected = theme === value

								return (
									<button
										key={value}
										type="button"
										role="radio"
										aria-checked={selected}
										onClick={() => setTheme(value)}
										className={cn(
											"flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm font-medium transition-colors",
											selected
												? "border-brand bg-income-soft text-foreground ring-1 ring-brand"
												: "text-muted-foreground hover:bg-muted hover:text-foreground"
										)}
									>
										<Icon className={cn("size-5", selected && "text-income")} />
										{label}
									</button>
								)
							})}
						</div>
					</section>

					<section className="flex flex-col gap-3">
						<SectionTitle>Conta</SectionTitle>

						{/* TODO: Implementar a troca de senha; até lá a opção fica visível, mas desabilitada. */}
						<button
							type="button"
							disabled
							className="flex h-12 items-center gap-3 rounded-lg border px-4 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
						>
							<KeyRound className="size-4 text-muted-foreground" />
							<span className="flex-1">Alterar senha</span>
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Em breve</span>
						</button>
					</section>
				</div>
			</SheetContent>
		</Sheet>
	)
}
