import { AuthShell } from "@/src/features/auth/components/AuthShell"
import { RegisterForm } from "@/src/features/auth/components/RegisterForm"

export default function RegisterPage() {
	return (
		<AuthShell>
			<RegisterForm />
		</AuthShell>
	)
}