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

interface UserSettingsSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UserSettingsSheet = ({
	open,
	onOpenChange,
}: UserSettingsSheetProps) => {
	return (
		<Sheet
			open={open}
			onOpenChange={onOpenChange}
		>
			<SheetContent className="w-full sm:max-w-md">
				<div className="flex h-full flex-col">
					<SheetHeader>
						<SheetTitle>Configurações</SheetTitle>

						<SheetDescription>
							Personalize sua conta e preferências.
						</SheetDescription>
					</SheetHeader>

					<div className="flex-1 space-y-6 px-4 py-6">
						<section className="space-y-3">
							<h3 className="text-sm font-semibold">
								Perfil
							</h3>

							<Button
								variant="outline"
								className="w-full justify-start"
							>
								Alterar avatar
							</Button>
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