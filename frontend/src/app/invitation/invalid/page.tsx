import { AuthShell } from "@/src/features/auth/components/AuthShell"
import { InvalidInvitationCard } from "@/src/features/auth/components/InvitationInvalidCard"

interface Props {
	searchParams: Promise<{
		reason?: string
	}>
}

export default async function InvalidInvitationPage({
	searchParams,
}: Props) {
	const { reason } = await searchParams

	return (
		<AuthShell>
			<InvalidInvitationCard
				message={reason}
			/>
		</AuthShell>
	)
}