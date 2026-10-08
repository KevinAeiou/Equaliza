import { ArrowRight } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn, formatCurrency } from "@/src/lib/utils"
import { SettlementBalanceProps } from "@/src/types"

interface SettlementSummaryProps {
	balance: SettlementBalanceProps
	userId: number
	onPay: (receiver: number) => void
}

export const SettlementSummary = ({ balance, userId, onPay }: SettlementSummaryProps) => {
	const mine = Number(balance.my_balance)
	const owes = mine < 0

	return (
		<div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
			<Card>
				<CardHeader>
					<CardDescription>Seu saldo</CardDescription>

					<CardTitle
						className={cn(
							"text-3xl font-semibold tabular-nums",
							owes ? "text-expense-strong" : mine > 0 ? "text-income" : "",
						)}
					>
						{formatCurrency(Math.abs(mine))}
					</CardTitle>
				</CardHeader>

				<CardContent className="text-sm text-muted-foreground">
					{owes && "Você deve esse valor aos outros membros."}
					{mine > 0 && "Esse valor é seu a receber."}
					{mine === 0 && "Você está em dia."}
				</CardContent>
			</Card>

			<Card className="lg:col-span-2">
				<CardHeader>
					<CardTitle className="font-semibold">Para equilibrar</CardTitle>
					<CardDescription>Quem paga quem para zerar os saldos da família.</CardDescription>
				</CardHeader>

				<CardContent className="flex flex-col gap-3">
					{!balance.suggestions.length && (
						<p className="text-sm text-muted-foreground">Nada a acertar. Todos estão quites.</p>
					)}

					{balance.suggestions.map((item) => {
						const isMine = item.payer === userId

						return (
							<div
								key={`${item.payer}-${item.receiver}`}
								className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-4 py-3 text-sm"
							>
								<span className="flex items-center gap-1.5">
									{item.payer_name}
									<ArrowRight className="size-3.5 text-muted-foreground" aria-label="paga a" />
									{item.receiver_name}
									<span className="font-semibold tabular-nums">{formatCurrency(Number(item.amount))}</span>
								</span>

								{isMine && (
									<Button size="sm" onClick={() => onPay(item.receiver)}>
										Pagar
									</Button>
								)}
							</div>
						)
					})}
				</CardContent>
			</Card>
		</div>
	)
}
