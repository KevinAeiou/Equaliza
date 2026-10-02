import { Suspense } from "react"
import { AuthShell } from "@/src/features/auth/components/AuthShell"
import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm"

export default function ResetPasswordPage() {
	return (
		<AuthShell>
			<Suspense>
				<ResetPasswordForm />
			</Suspense>
		</AuthShell>
	)
}
