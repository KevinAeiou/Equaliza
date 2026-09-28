"use client"

import { MailX } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import { FormHeaderField } from "./FormHeaderField"

interface InvalidInvitationCardProps {
	message: string | undefined
}

export const InvalidInvitationCard = ({
	message,
}: InvalidInvitationCardProps) => {
	const router = useRouter()

	return (
		<div className="flex flex-col gap-8">
			<span className="flex size-12 items-center justify-center rounded-xl bg-expense-soft text-expense-strong">
				<MailX className="size-5" />
			</span>

			<FormHeaderField
				title="Convite indisponível"
				description={message || "Este convite não pode mais ser usado."}
			/>

			<p className="text-sm leading-6 text-muted-foreground">
				Peça ao responsável pela família que envie um novo convite para concluir seu cadastro.
			</p>

			<Button
				className="h-10 w-full"
				onClick={() => router.replace("/login")}
			>
				Voltar para o login
			</Button>
		</div>
	)
}
