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
		<main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
			<InvalidInvitationCard
				message={reason}
			/>
		</main>
	)
}