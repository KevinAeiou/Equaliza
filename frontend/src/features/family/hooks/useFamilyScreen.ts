import { FamilyProps } from "@/src/types"
import { useState } from "react"


export const useFamilyScreen = () => {
	const [open, setOpen] = useState<boolean>(false)
	const [refresh, setRefresh] = useState<number>(0)
	const [selectedFamily, setSelectedFamily] = useState<FamilyProps | undefined>(undefined)

	return {
		open, setOpen,
		refresh, setRefresh,
		selectedFamily, setSelectedFamily,
	}
}