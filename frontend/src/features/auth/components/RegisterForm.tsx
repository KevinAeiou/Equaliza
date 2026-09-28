"use client"

import { MailCheck } from "lucide-react"
import { useWatch } from "react-hook-form"
import { Button } from "@/src/components/ui/button"
import { FieldGroup } from "@/src/components/ui/field"

import { FormTextField } from "./FormTextField"
import { FormPasswordField } from "./FormPasswordField"
import { FormHeaderField } from "./FormHeaderField"
import { useFormRegister } from "../hooks/useFormRegister"
import { NavigationButton } from "./NavigationButton"


export function RegisterForm() {
	const {
		form,
		onSubmit,
		loading,
		invitationMode,
	} = useFormRegister()

	const familyName = useWatch({ control: form.control, name: "family_name" })

	return (
		<div className="flex flex-col gap-8">
			<FormHeaderField
				title={invitationMode ? "Aceitar convite" : "Criar conta"}
				description={
					invitationMode
						? "Crie sua conta para começar a organizar as finanças junto com a família."
						: "Crie sua conta e sua família para começar a organizar as finanças."
				}
			/>

			{invitationMode && familyName && (
				<div className="flex items-start gap-3 rounded-xl bg-income-soft p-4 text-sm">
					<MailCheck className="mt-0.5 size-4 shrink-0 text-income" />
					<p>
						Você recebeu um convite para participar da <span className="font-semibold">{familyName}</span>.
					</p>
				</div>
			)}

			<form
				id="form-register"
				className="flex flex-col gap-6"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<FieldGroup>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormTextField
							control={form.control}
							name="first_name"
							label="Nome"
							placeholder="Seu nome"
							autoComplete="given-name"
						/>

						<FormTextField
							control={form.control}
							name="last_name"
							label="Sobrenome"
							placeholder="Seu sobrenome"
							autoComplete="family-name"
						/>
					</div>

					{/* No convite, família e e-mail vêm do convite e não podem ser alterados. */}
					{!invitationMode && (
						<FormTextField
							control={form.control}
							name="family_name"
							label="Nome da família"
							placeholder="Ex.: Família Silva"
						/>
					)}

					<FormTextField
						control={form.control}
						name="email"
						type="email"
						label="E-mail"
						disabled={invitationMode}
						placeholder="voce@exemplo.com"
						autoComplete="email"
					/>

					<FormPasswordField
						control={form.control}
						name="password"
						label="Senha"
						placeholder="Crie uma senha"
					/>

					<FormPasswordField
						control={form.control}
						name="passwordConfirmation"
						label="Confirmar senha"
						placeholder="Repita a senha"
					/>
				</FieldGroup>

				<Button
					type="submit"
					className="h-10 w-full"
					disabled={loading}
				>
					{loading
						? `Criando conta...`
						: invitationMode ? `Criar conta e entrar na família` : `Criar conta`}
				</Button>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				Já tem uma conta?{" "}
				<NavigationButton href="/login">
					Entrar
				</NavigationButton>
			</p>
		</div>
	)
}
