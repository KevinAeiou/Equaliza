import { useState } from "react"

export const useSheetNavigation = () => {
	const [open, setOpen] = useState(false)

	const handleClose = () => setOpen(false)

	return {
		open, setOpen,
		handleClose,
	}
}