import { useState } from "react"
import { useAuth } from "../../features/auth/context/AuthProvider"
import { FamilyProps } from "@/src/types"
import { FamilyAPI } from "../../features/member/infra/family"
import { useInvitationScreen } from "../../features/invitation/hooks/useInvitationScreen"

export const useMenuNavegation = () => {
	const {
		open: showInviteDialog, setOpen: setShowInviteDialog,
	} = useInvitationScreen()

	const { user, refreshUser } = useAuth()

	const hasRole = (...roles: string[]) => {
		if (!user?.role) return false

		return roles.includes(user.role)
	}

	const [selectedFamily, setSelectedFamily] = useState<FamilyProps | undefined>(
		() => user?.current_family ?? undefined
	)

	const familyAPI = FamilyAPI()

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
			await familyAPI.changeCurrentFamily(family.id)

			setSelectedFamily(family)

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