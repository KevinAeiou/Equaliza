import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { isApiError } from "@/src/lib/utils"
import { ImportBatchProps, PendingDirection, PendingProps } from "@/src/types"
import { importsApi, notifyPendingChanged } from "../infra/imports"

export const usePendingScreen = () => {
	const [direction, setDirection] = useState<PendingDirection | "ALL">("ALL")
	const [cardPaymentsOnly, setCardPaymentsOnly] = useState(false)
	const [batch, setBatch] = useState<number | undefined>(undefined)
	const [items, setItems] = useState<PendingProps[]>([])
	const [batches, setBatches] = useState<ImportBatchProps[]>([])
	// A lista carregada vale para uma chave de consulta; enquanto ela difere da atual, está carregando.
	const [loadedKey, setLoadedKey] = useState<string | undefined>(undefined)
	const [selected, setSelected] = useState<Set<number>>(new Set())
	const [refresh, setRefresh] = useState(0)
	const [registering, setRegistering] = useState<PendingProps | "bulk" | undefined>(undefined)
	const [dismissing, setDismissing] = useState<number[] | undefined>(undefined)

	const queryKey = `${direction}|${cardPaymentsOnly}|${batch ?? ""}|${refresh}`
	const loading = loadedKey !== queryKey

	useEffect(() => {
		let active = true

		importsApi
			.listPending({
				direction: direction === "ALL" ? undefined : direction,
				flag: cardPaymentsOnly ? "CARD_PAYMENT" : undefined,
				batch,
			})
			.then((response) => {
				if (!active) return

				setItems(response)
				setSelected(new Set())
				setLoadedKey(queryKey)
			})
			.catch((error) => {
				if (!active) return

				toast.error(isApiError(error) ? error.message : "Erro ao listar as pendências")
				setLoadedKey(queryKey)
			})

		return () => {
			active = false
		}
	}, [direction, cardPaymentsOnly, batch, queryKey])

	useEffect(() => {
		importsApi.listBatches().then(setBatches).catch(() => setBatches([]))
	}, [refresh])

	const reload = useCallback(() => setRefresh((value) => value + 1), [])

	const toggle = (id: number) =>
		setSelected((current) => {
			const next = new Set(current)

			if (!next.delete(id)) next.add(id)

			return next
		})

	const allSelected = items.length > 0 && selected.size === items.length

	const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)))

	const selectedItems = useMemo(() => items.filter((item) => selected.has(item.id)), [items, selected])

	// Créditos só podem ser marcados como lidos até a etapa de rendas (5C).
	const hasCredit = selectedItems.some((item) => item.direction === "CREDIT")

	const confirmDismiss = async () => {
		if (!dismissing) return

		try {
			await importsApi.bulk(dismissing, "dismiss")
			toast.success("Marcadas como lidas.")
			notifyPendingChanged()
			reload()
		} catch (error) {
			toast.error(isApiError(error) ? error.message : "Erro ao marcar como lidas")
		} finally {
			setDismissing(undefined)
		}
	}

	return {
		direction, setDirection,
		cardPaymentsOnly, setCardPaymentsOnly,
		batch, setBatch,
		items, batches, loading,
		selected, toggle, allSelected, toggleAll, selectedItems, hasCredit,
		registering, setRegistering,
		dismissing, setDismissing, confirmDismiss,
		reload,
	}
}
