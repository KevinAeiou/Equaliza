import { Suspense } from "react"
import { AuthShell } from "@/src/features/auth/components/AuthShell"
import { LoginForm } from "@/src/features/auth/components/LoginForm"

export default function LoginPage() {
    return (
		<AuthShell>
			<Suspense>
				<LoginForm />
			</Suspense>
		</AuthShell>
    )
}
