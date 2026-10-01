"use client"

import { Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { FormHeaderField } from "@/src/features/auth/components/FormHeaderField"
import { NavigationButton } from "@/src/features/auth/components/NavigationButton"
import Loading from "@/src/app/loading"
import { useAcceptInvitation } from "../hooks/useAcceptInvitation"

export const AcceptInvitationCard = () => {
	const {
		invitation,
		invitedEmail,
		loading,
		accepting,
		error,
		isLoggedIn,
		userEmail,
		loginHref,
		registerHref,
		accept,
	} = useAcceptInvitation()

	if (loading || !invitation) {
		return <Loading />
	}

	return (
		<div className="flex flex-col gap-8">
			<span className="flex size-12 items-center justify-center rounded-xl bg-income-soft text-income-strong">
				<Users className="size-5" />
			</span>

			<FormHeaderField
				title="Você foi convidado"
				description={
					<>
						Você recebeu um convite para participar da família{" "}
						<strong className="text-foreground">{invitation.name}</strong>.
					</>
				}
			/>

			{isLoggedIn ? (
				<div className="flex flex-col gap-4">
					<p className="text-sm text-muted-foreground">
						Você está conectado como <strong className="text-foreground">{userEmail}</strong>.
						Ao aceitar, a família será adicionada às suas famílias e passará a ser a família atual.
					</p>

					{invitedEmail && invitedEmail.toLowerCase() !== userEmail.toLowerCase() && (
						<p className="text-sm text-expense-strong">
							Este convite foi enviado para {invitedEmail}. Entre com essa conta para aceitá-lo.
						</p>
					)}

					{error && <p role="alert" className="text-sm text-expense-strong">{error}</p>}

					<Button className="h-10 w-full" onClick={accept} disabled={accepting}>
						{accepting ? "Entrando..." : "Entrar na família"}
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					<Button
						className="h-10 w-full"
						render={<Link href={loginHref} />}
					>
						Já tenho conta
					</Button>

					<p className="text-center text-sm text-muted-foreground">
						Ainda não tem uma conta?{" "}
						<NavigationButton href={registerHref}>Criar conta</NavigationButton>
					</p>
				</div>
			)}
		</div>
	)
}
