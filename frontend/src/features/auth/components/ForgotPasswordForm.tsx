"use client"

import { useFormForgotPassword } from "../hooks/useFormForgotPassword"
import { FormTextField } from "./FormTextField"
import { Button } from "@/src/components/ui/button"
import { FieldGroup } from "@/src/components/ui/field"
import { FormHeaderField } from "./FormHeaderField"
import { NavigationButton } from "./NavigationButton"

export function ForgotPasswordForm() {
	const {
		onSubmit,
		loading,
		sent,
		form,
	} = useFormForgotPassword()

	return (
		<div className="flex flex-col gap-8">
			<FormHeaderField
				title="Recuperar senha"
				description={
					sent
						? "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha. Verifique também a caixa de spam."
						: "Informe seu e-mail e enviaremos um link para você criar uma nova senha."
				}
			/>

			{!sent && (
				<form
					id="form-forgot-password"
					className="flex flex-col gap-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<FieldGroup>
						<FormTextField
							control={form.control}
							name="email"
							type="email"
							placeholder="voce@exemplo.com"
							label="E-mail"
							autoComplete="email"
						/>
					</FieldGroup>

					<Button
						type="submit"
						className="h-10 w-full"
						disabled={loading}
					>
						{loading ? `Enviando...` : `Enviar link`}
					</Button>
				</form>
			)}

			<p className="text-center text-sm text-muted-foreground">
				Lembrou da senha?{" "}
				<NavigationButton href="/login">
					Voltar ao login
				</NavigationButton>
			</p>
		</div>
	)
}
