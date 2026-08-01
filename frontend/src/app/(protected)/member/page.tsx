import ProtectedRoute from "@/src/components/auth/ProtectedRoute";
import { MemberScreen } from "@/src/features/member/components/MemberScreen";
import { UserRole } from "@/src/types";

export default function MemberPage() {
	return (
		<ProtectedRoute
			role={[UserRole.ADMIN, UserRole.OWNER]}
		>
			<MemberScreen />
		</ProtectedRoute>
	)
}