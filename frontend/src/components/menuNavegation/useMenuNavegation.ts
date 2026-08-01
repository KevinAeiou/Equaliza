import { AuthService } from "@/src/features/auth/services/auth.service"
import { useAuth } from "../providers/AuthProvider"
import { useInvitationScreen } from "../../features/invitation/hooks/useInvitationScreen"
import { useFamilyScreen } from "@/src/features/family/hooks/useFamilyScreen"
import { toast } from "sonner"
import { isApiError } from "@/src/lib/utils"

export const useMenuNavegation = () => {

	const {
		open: showInviteDialog, setOpen: setShowInviteDialog,
	} = useInvitationScreen()
	const {
		open: showFamilyDialog, setOpen: setShowFamilyDialog,
	} = useFamilyScreen()
	const { user, refreshUser } = useAuth()

	const hasRole = (...roles: string[]) => {
		if (!user?.role) return true

		return roles.includes(user.role)
	}

	const selectedFamily = user?.current_family

	const isAdmin = hasRole("Responsável", "Administrador")

	const families = user?.families.map((family) => ({
		label: family.name,
		value: family.id.toString(),
	})) ?? []

	const handleFamilyChange = async (value: string | null) => {
		if (!value) return

		const family = user?.families.find(
			(family) => family.id.toString() === value
		)

		if (!family) return

		try {
			await AuthService.changeCurrentFamily(family.id)

			await refreshUser()
		} catch (error) {
			if (!isApiError(error)) return

			toast.error(error.message)
		}
	}

	return {
		families,
		selectedFamily,
		handleFamilyChange,
		isAdmin,
		showInviteDialog, setShowInviteDialog,
		showFamilyDialog, setShowFamilyDialog,
	}
}