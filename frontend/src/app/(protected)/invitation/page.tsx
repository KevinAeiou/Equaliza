import ProtectedRoute from "@/src/components/auth/ProtectedRoute";
import { InvitationScreen } from "@/src/features/invitation/components/InvitationScreen";
import { UserRole } from "@/src/types";

export default function InvitationPage() {
	return (
		<ProtectedRoute
			role={[UserRole.ADMIN, UserRole.OWNER]}
		>
			<InvitationScreen />
		</ProtectedRoute>
	)
}