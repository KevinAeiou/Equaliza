"use client"

import { Card, CardContent, CardFooter } from "@/src/components/ui/card"
import { FormHeaderField } from "./FormHeaderField"
import { NavigationButton } from "./NavigationButton"
import { Field } from "@/src/components/ui/field"
import { Button } from "@/src/components/ui/button"
import { useRouter } from "next/navigation"

interface InvalidInvitationCardProps {
	message: string | undefined
}

export const InvalidInvitationCard = ({
	message,
}: InvalidInvitationCardProps) => {
	const router = useRouter()

	return (
		<Card className="w-full max-w-md shadow-xl">
			<FormHeaderField
				title="Convite indisponível"
				description={message}
			>
				<NavigationButton href="/login">
					Entrar
				</NavigationButton>
			</FormHeaderField>

			<CardContent>
				<p className="text-center text-sm text-muted-foreground leading-6">
					Solicite ao responsável pela família o envio de um
					novo convite para concluir seu cadastro.
				</p>
			</CardContent>

			<CardFooter>
				<Field>
					<Button
						className="w-full"
						onClick={() => router.replace("/login")}
					>
						Voltar para o login
					</Button>
				</Field>
			</CardFooter>
		</Card>
	)
}