"use client" // Error boundaries precisam ser Client Components

import { useEffect } from "react"
import { ErrorScreen } from "@/src/components/errorScreen"

export default function Error({
	error,
	unstable_retry,
}: {
	error: Error & { digest?: string }
	unstable_retry: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<ErrorScreen
			variant="error"
			code="Algo deu errado"
			title="Não foi possível carregar esta página"
			description="Ocorreu um erro inesperado. Tente novamente; se o problema continuar, volte mais tarde."
			note={error.digest ? `Código do erro: ${error.digest}` : undefined}
			onRetry={unstable_retry}
		/>
	)
}
