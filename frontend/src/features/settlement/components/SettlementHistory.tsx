import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/src/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/src/components/ui/table"
import { formatCurrency, isApiError } from "@/src/lib/utils"
import { SettlementMemberProps, SettlementStatus } from "@/src/types"
import { useSettlementHistory } from "../hooks/useSettlementHistory"
import { SettlementService } from "../services/settlement.service"
import { monthShortLabel } from "../utils"

interface SettlementHistoryProps {
	month: string
	members: SettlementMemberProps[]
	canCancel: boolean
	refresh: number
	onChanged: () => void
}

const ALL = "ALL"

const STATUS_OPTIONS = [
	{ label: "Todos os status", value: ALL },
	{ label: "Ativos", value: "ACTIVE" },
	{ label: "Estornados", value: "CANCELLED" },
]

const formatDay = (value: string) => value.split("-").reverse().join("/")

export const SettlementHistory = ({
	month,
	members,
	canCancel,
	refresh,
	onChanged,
}: SettlementHistoryProps) => {
	const [member, setMember] = useState<string>(ALL)
	const [status, setStatus] = useState<string>(ALL)
	const [cancelling, setCancelling] = useState<number>()

	const filters = useMemo(
		() => ({
			member: member === ALL ? undefined : Number(member),
			status: status === ALL ? undefined : (status as SettlementStatus),
		}),
		[member, status],
	)

	const { items, loading, error } = useSettlementHistory(month, filters, refresh)

	const memberOptions = [
		{ label: "Todos os membros", value: ALL },
		...members.map((item) => ({ label: item.name, value: item.id.toString() })),
	]

	const cancel = async (id: number) => {
		if (!window.confirm("Estornar este pagamento? O saldo será recalculado sem ele.")) return

		setCancelling(id)

		try {
			await SettlementService.cancel(id)

			toast.success("Pagamento estornado.")
			onChanged()
		} catch (err: unknown) {
			if (isApiError(err)) toast.error(err.message)
		} finally {
			setCancelling(undefined)
		}
	}

	return (
		<Card className="min-w-0">
			<CardHeader>
				<CardTitle className="font-semibold">Histórico</CardTitle>
				<CardDescription>Pagamentos registrados para o mês selecionado.</CardDescription>

				<div className="flex flex-wrap gap-2 pt-2">
					<Select value={member} onValueChange={(value) => setMember(value ?? ALL)} items={memberOptions}>
						<SelectTrigger className="w-48" aria-label="Filtrar por membro">
							<SelectValue />
						</SelectTrigger>

						<SelectContent>
							{memberOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={status} onValueChange={(value) => setStatus(value ?? ALL)} items={STATUS_OPTIONS}>
						<SelectTrigger className="w-44" aria-label="Filtrar por status">
							<SelectValue />
						</SelectTrigger>

						<SelectContent>
							{STATUS_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>

			<CardContent className="overflow-x-auto">
				{loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
				{error && <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p>}
				{items && !items.length && (
					<p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
				)}

				{items && items.length > 0 && (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Data</TableHead>
								<TableHead>Referência</TableHead>
								<TableHead>Pagou</TableHead>
								<TableHead>Recebeu</TableHead>
								<TableHead className="text-right">Valor</TableHead>
								<TableHead>Restou</TableHead>
								<TableHead>Observação</TableHead>
								<TableHead>Status</TableHead>
								{canCancel && <TableHead />}
							</TableRow>
						</TableHeader>

						<TableBody>
							{items.map((item) => {
								const active = item.status === "ACTIVE"

								return (
									<TableRow key={item.id} className={active ? undefined : "text-muted-foreground"}>
										<TableCell>{formatDay(item.paid_at ?? "")}</TableCell>
										<TableCell>{monthShortLabel(item.reference_month)}</TableCell>
										<TableCell>{item.payer.name}</TableCell>
										<TableCell>{item.receiver.name}</TableCell>
										<TableCell className="text-right font-medium tabular-nums">
											{formatCurrency(Number(item.amount))}
										</TableCell>
										<TableCell className="tabular-nums">
											{Number(item.remaining_after ?? 0) > 0 && item.carried_to
												? `${formatCurrency(Number(item.remaining_after ?? 0))} em ${monthShortLabel(item.carried_to)}`
												: "—"}
										</TableCell>
										<TableCell className="max-w-48 truncate">{item.note || "—"}</TableCell>
										<TableCell>
											<Badge variant={active ? "secondary" : "outline"}>
												{active ? "Ativo" : "Estornado"}
											</Badge>
										</TableCell>
										{canCancel && (
											<TableCell className="text-right">
												{active && (
													<Button
														variant="ghost"
														size="sm"
														disabled={cancelling === item.id}
														onClick={() => cancel(item.id)}
													>
														Cancelar
													</Button>
												)}
											</TableCell>
										)}
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}
