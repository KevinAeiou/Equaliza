import { RoleGuard } from "@/src/components/auth/RoleGuard"
import { UserRole } from "@/src/types"

export default function InvitationLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<RoleGuard role={[UserRole.ADMIN, UserRole.OWNER]}>
			{children}
		</RoleGuard>
	)
}