import { Suspense } from "react"
import { AuthShell } from "@/src/features/auth/components/AuthShell"
import { AcceptInvitationCard } from "@/src/features/invitation/components/AcceptInvitationCard"

export default function AcceptInvitationPage() {
	return (
		<AuthShell>
			<Suspense>
				<AcceptInvitationCard />
			</Suspense>
		</AuthShell>
	)
}
