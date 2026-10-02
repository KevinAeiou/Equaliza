import { AuthShell } from "@/src/features/auth/components/AuthShell"
import { ForgotPasswordForm } from "@/src/features/auth/components/ForgotPasswordForm"

export default function ForgotPasswordPage() {
	return (
		<AuthShell>
			<ForgotPasswordForm />
		</AuthShell>
	)
}
