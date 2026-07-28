"use client"

import { Card, CardContent, CardFooter } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Field, FieldGroup } from "@/src/components/ui/field"

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

	return (
		<Card className="w-full max-w-md shadow-xl">
			<FormHeaderField
				title="Criar conta"
				description="Preencha seus dados para criar uma nova conta."
			>
				<NavigationButton href="/login">
					Entrar
				</NavigationButton>
			</FormHeaderField>

			<CardContent className="mb-4">
				<form
					id="form-register"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<FieldGroup>
						<FormTextField
							control={form.control}
							name="first_name"
							label="Nome"
							placeholder="Informe seu nome"
						/>

						<FormTextField
							control={form.control}
							name="last_name"
							label="Sobrenome"
							placeholder="Informe seu sobrenome"
						/>

						<FormTextField
							control={form.control}
							name="family_name"
							label="Família"
							disabled={invitationMode}
							placeholder="Informe o nome da família"
						/>

						<FormTextField
							control={form.control}
							name="email"
							type="email"
							label="E-mail"
							disabled={invitationMode}
							placeholder="Informe seu e-mail"
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
							placeholder="Confirme sua senha"
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				<Field>
					<Button
						type="submit"
						className="w-full"
						form="form-register"
						disabled={loading}
					>
						{
							loading
								? `Criando conta...`
								: `Cadastrar`
						}
					</Button>
				</Field>
			</CardFooter>
		</Card>
	)
}