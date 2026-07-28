"use client"

import { Card, CardContent, CardFooter } from "@/src/components/ui/card"
import { useFormLogin } from "../hooks/useFormLogin"
import { FormTextField } from "./FormTextField"
import { Button } from "@/src/components/ui/button"
import { Field, FieldGroup } from "@/src/components/ui/field"
import { FormPasswordField } from "./FormPasswordField"
import { FormHeaderField } from "./FormHeaderField"
import { NavigationButton } from "./NavigationButton"
import Image from "next/image"

export function LoginForm() {
	const {
		onSubmit,
		loading,
		form,
	} = useFormLogin()

	return (
		<Card className="w-full max-w-md shadow-xl">
			<div className="mb-4 flex justify-center">
				<Image
					src="/logo.svg"
					alt="Equaliza"
					width={180}
					height={48}
					className="block dark:hidden transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-sm"
					priority
				/>

				<Image
					src="/logo-white.svg"
					alt="Equaliza"
					width={180}
					height={48}
					className="hidden dark:block transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-sm"
					priority
				/>
			</div>

			<FormHeaderField
				title="Entrar"
				description="Informe seu e-mail e senha para acessar sua conta."
			>
				<NavigationButton href="/register">
					Cadastre-se
				</NavigationButton>
			</FormHeaderField>

			<CardContent className="mb-4">
				<form
					id="form-login"
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<FieldGroup>
						<FormTextField
							control={form.control}
							name="email"
							type="email"
							placeholder="Informe seu e-mail"
							label="E-mail"
						/>

						<FormPasswordField
							control={form.control}
							name="password"
							placeholder="Informe sua senha"
							label="Senha"
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				<Field>
					<Button
						type="submit"
						className="w-full"
						form="form-login"
						disabled={loading}
					>
						{loading ? `Carregando...` : `Entrar`}
					</Button>

					{/* TODO: Implementar autenticação pela conta google */}
					{/* <Button variant="outline" className="w-full">
						Entrar com Google
					</Button> */}
				</Field>
			</CardFooter>
		</Card>
	)
}