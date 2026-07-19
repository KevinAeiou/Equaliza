import { useState } from "react"


export const useInvitationScreen = () => {
	const [open, setOpen] = useState<boolean>(false)

	return {
		open, setOpen,
	}
}