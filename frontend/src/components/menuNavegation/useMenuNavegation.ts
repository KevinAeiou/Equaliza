import { AuthService } from "@/src/features/auth/services/auth.service"
import { useAuth } from "../../features/auth/context/AuthProvider"
import { useInvitationScreen } from "../../features/invitation/hooks/useInvitationScreen"

export const useMenuNavegation = () => {
	const {
		open: showInviteDialog, setOpen: setShowInviteDialog,
	} = useInvitationScreen()

	const { user, refreshUser } = useAuth()

	const hasRole = (...roles: string[]) => {
		if (!user?.role) return true

		return roles.includes(user.role)
	}

	const selectedFamily = user?.current_family

	const canInvite = hasRole("Responsável", "Administrador")

	const families = user?.families.map((family) => ({
		label: family.name,
		value: family.id.toString(),
	})) ?? []

	const handleFamilyChange = async (value: string | null) => {
		const family = user?.families.find(
			(family) => family.id.toString() === value
		)

		if (!family) return

		try {
			await AuthService.changeCurrentFamily(family.id)

			await refreshUser()
		} catch (error) {
			console.error(error)
		}
	}

	return {
		families,
		selectedFamily,
		handleFamilyChange,
		canInvite,
		showInviteDialog, setShowInviteDialog,
	}
}