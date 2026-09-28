"use client"

import { ChevronsUpDown, Settings2 } from "lucide-react"
import Link from "next/link"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { getFamilyMonogram } from "@/src/features/dashboard/utils"
import { useMenuNavegation } from "../menuNavegation/useMenuNavegation"

export const FamilySwitcher = () => {
	const {
		families,
		selectedFamily,
		handleFamilyChange,
	} = useMenuNavegation()

	if (!selectedFamily) {
		return (
			<Link
				href="/family"
				className="flex h-9 items-center rounded-lg border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted"
			>
				Criar ou entrar em uma família
			</Link>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`Família atual: ${selectedFamily.name}. Trocar de família`}
				className="flex h-9 max-w-56 items-center gap-2 rounded-lg border bg-card pr-2 pl-1 text-sm transition-colors hover:bg-muted"
			>
				<span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-semibold text-brand-foreground">
					{getFamilyMonogram(selectedFamily.name)}
				</span>

				<span className="truncate font-medium">{selectedFamily.name}</span>

				<ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="w-60">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Suas famílias</DropdownMenuLabel>

					<DropdownMenuRadioGroup
						value={selectedFamily.id.toString()}
						onValueChange={(value) => handleFamilyChange(String(value))}
					>
						{families.map((family) => (
							<DropdownMenuRadioItem key={family.value} value={family.value} className="gap-2 py-1.5">
								<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold">
									{getFamilyMonogram(family.label)}
								</span>
								<span className="truncate">{family.label}</span>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem render={<Link href="/family" />}>
					<Settings2 className="size-4" />
					Gerenciar famílias
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
