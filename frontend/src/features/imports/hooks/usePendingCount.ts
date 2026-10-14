import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { importsApi, PENDING_CHANGED_EVENT } from "../infra/imports"

// `null` enquanto carrega ou quando a importação está desligada no servidor (o menu esconde o item).
export const usePendingCount = () => {
	const pathname = usePathname()
	const [count, setCount] = useState<number | null>(null)

	useEffect(() => {
		let active = true

		const load = () => {
			importsApi.pendingCount().then((value) => {
				if (active) setCount(value)
			})
		}

		load()
		window.addEventListener(PENDING_CHANGED_EVENT, load)

		return () => {
			active = false
			window.removeEventListener(PENDING_CHANGED_EVENT, load)
		}
	}, [pathname])

	return count
}
