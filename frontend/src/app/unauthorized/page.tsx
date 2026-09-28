"use client"

import { ErrorScreen } from "@/src/components/errorScreen"

export default function Unauthorized() {
	return (
		<ErrorScreen
			variant="unauthorized"
			code="Erro 403"
			title="Acesso restrito"
			description="Esta área é exclusiva para responsáveis e administradores da família selecionada."
			note="Se precisar de acesso, peça ao responsável pela família para mudar sua função, ou troque para outra família em que você seja administrador."
		/>
	)
}
