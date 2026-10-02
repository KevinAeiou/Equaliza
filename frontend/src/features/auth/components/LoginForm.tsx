"use client"

import { useFormLogin } from "../hooks/useFormLogin"
import { FormTextField } from "./FormTextField"
import { Button } from "@/src/components/ui/button"
import { FieldGroup } from "@/src/components/ui/field"
import { FormPasswordField } from "./FormPasswordField"
import { FormHeaderField } from "./FormHeaderField"
import { NavigationButton } from "./NavigationButton"

export function LoginForm() {
	const {
		onSubmit,
		loading,
		form,
	} = useFormLogin()

	return (
		<div className="flex flex-col gap-8">
			<FormHeaderField
				title="Entrar"
				description="Informe seu e-mail e senha para acessar sua conta."
			/>

			<form
				id="form-login"
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

					<FormPasswordField
						control={form.control}
						name="password"
						placeholder="Sua senha"
						label="Senha"
					/>

					<div className="-mt-2 flex justify-end">
						<NavigationButton href="/forgot-password" className="text-sm">
							Esqueci minha senha
						</NavigationButton>
					</div>
				</FieldGroup>

				<Button
					type="submit"
					className="h-10 w-full"
					disabled={loading}
				>
					{loading ? `Entrando...` : `Entrar`}
				</Button>

				{/* TODO: Implementar autenticação pela conta google */}
			</form>

			<p className="text-center text-sm text-muted-foreground">
				Ainda não tem uma conta?{" "}
				<NavigationButton href="/register">
					Criar conta
				</NavigationButton>
			</p>
		</div>
	)
}
