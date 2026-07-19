""

import { AVATARS } from "@/src/constants/avatars"
import { useAuth } from "@/src/features/auth/context/AuthProvider"
import { useRouter } from "next/navigation"
import { useState } from "react"


export const useUserNavigation = () => {
	const [showSettings, setShowSettings] = useState(false)
	const [showProfile, setShowProfile] = useState(false)

	const router = useRouter()

	const { user, logout } = useAuth()

	const avatar = AVATARS.find(
		item => item.id === user.avatar.id
	)

	const handleLogout = async () => {
		logout()

		router.replace("/login")
		router.refresh()
	}
	return {
		user,
		avatar,
		handleLogout,
		showSettings, setShowSettings,
		showProfile, setShowProfile,
	}
}