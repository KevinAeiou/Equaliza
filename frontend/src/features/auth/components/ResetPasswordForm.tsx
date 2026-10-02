"use client"

import { useFormResetPassword } from "../hooks/useFormResetPassword"
import { Button } from "@/src/components/ui/button"
import { FieldGroup } from "@/src/components/ui/field"
import { FormPasswordField } from "./FormPasswordField"
import { FormHeaderField } from "./FormHeaderField"
import { NavigationButton } from "./NavigationButton"

export function ResetPasswordForm() {
	const {
		onSubmit,
		loading,
		validLink,
		form,
	} = useFormResetPassword()

	if (!validLink) {
		return (
			<div className="flex flex-col gap-8">
				<FormHeaderField
					title="Link inválido"
					description="O link de recuperação é inválido ou expirou. Solicite um novo."
				/>

				<NavigationButton href="/forgot-password">
					Solicitar novo link
				</NavigationButton>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-8">
			<FormHeaderField
				title="Nova senha"
				description="Crie uma nova senha para acessar sua conta."
			/>

			<form
				id="form-reset-password"
				className="flex flex-col gap-6"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<FieldGroup>
					<FormPasswordField
						control={form.control}
						name="password"
						placeholder="Mínimo de 8 caracteres"
						label="Nova senha"
						autoComplete="new-password"
					/>

					<FormPasswordField
						control={form.control}
						name="passwordConfirmation"
						placeholder="Repita a nova senha"
						label="Confirmar nova senha"
						autoComplete="new-password"
					/>
				</FieldGroup>

				<Button
					type="submit"
					className="h-10 w-full"
					disabled={loading}
				>
					{loading ? `Salvando...` : `Redefinir senha`}
				</Button>
			</form>
		</div>
	)
}
