import { useState } from "react"


export const useInvitationScreen = () => {
	const [open, setOpen] = useState<boolean>(false)
	const [refresh, setRefresh] = useState<number>(0)

	return {
		open, setOpen,
		refresh, setRefresh,
	}
}