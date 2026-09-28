"use client"

import { ErrorScreen } from "@/src/components/errorScreen"

export default function NotFound() {
	return (
		<ErrorScreen
			variant="not-found"
			code="Erro 404"
			title="Página não encontrada"
			description="O endereço pode estar incorreto ou a página pode ter sido movida ou removida."
		/>
	)
}
