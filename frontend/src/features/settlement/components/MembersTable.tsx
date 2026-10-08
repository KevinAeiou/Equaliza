import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/src/components/ui/table"
import { cn, formatCurrency } from "@/src/lib/utils"
import { SettlementMemberProps } from "@/src/types"

const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatCurrency(Math.abs(value))}`

const tone = (value: number) =>
	value > 0 ? "text-income" : value < 0 ? "text-expense-strong" : "text-muted-foreground"

export const MembersTable = ({ members }: { members: SettlementMemberProps[] }) => (
	<Card className="min-w-0">
		<CardHeader>
			<CardTitle className="font-semibold">Saldo por membro</CardTitle>
			<CardDescription>
				Cota proporcional à receita do mês. O que sobra do mês anterior aparece como saldo anterior.
			</CardDescription>
		</CardHeader>

		<CardContent className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Membro</TableHead>
						<TableHead className="text-right">Pagou</TableHead>
						<TableHead className="text-right">Cota</TableHead>
						<TableHead className="text-right">Diferença</TableHead>
						<TableHead className="text-right">Saldo anterior</TableHead>
						<TableHead className="text-right">Acertos</TableHead>
						<TableHead className="text-right">Saldo final</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{members.map((member) => (
						<TableRow key={member.id}>
							<TableCell className="font-medium">
								{member.name}
								{!member.is_active && <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>}
							</TableCell>
							<TableCell className="text-right tabular-nums">{formatCurrency(Number(member.paid))}</TableCell>
							<TableCell className="text-right tabular-nums">{formatCurrency(Number(member.quota))}</TableCell>
							<TableCell className={cn("text-right tabular-nums", tone(Number(member.difference)))}>
								{signed(Number(member.difference))}
							</TableCell>
							<TableCell className={cn("text-right tabular-nums", tone(Number(member.previous_balance)))}>
								{signed(Number(member.previous_balance))}
							</TableCell>
							<TableCell className="text-right tabular-nums">{signed(Number(member.settled))}</TableCell>
							<TableCell className={cn("text-right font-semibold tabular-nums", tone(Number(member.balance)))}>
								{signed(Number(member.balance))}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
)
