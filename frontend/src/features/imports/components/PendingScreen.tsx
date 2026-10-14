"use client"

import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, EyeOff, Upload } from "lucide-react"
import { HeaderScreen } from "@/src/components/headerScreen"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Checkbox } from "@/src/components/ui/checkbox"
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
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { cn, formatCurrency } from "@/src/lib/utils"
import { PendingDirection } from "@/src/types"
import { usePendingScreen } from "../hooks/usePendingScreen"
import { batchLabel, formatPendingDate } from "../utils"
import { DismissPendingDialog } from "./DismissPendingDialog"
import { RegisterPendingDialog } from "./RegisterPendingDialog"

const ALL_BATCHES = "ALL"

export const PendingScreen = () => {
	const screen = usePendingScreen()
	const { items, loading, selected, registering, dismissing } = screen
	const batchOptions = [
		{ value: ALL_BATCHES, label: "Todos os arquivos" },
		...screen.batches.map((batch) => ({ value: String(batch.id), label: batchLabel(batch) })),
	]

	return (
		<section className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Pendências"
					subtitle="Linhas dos extratos e faturas que você enviou. Registre como despesa ou marque como lidas."
				/>

				<Button render={<Link href="/pending/import" />} className="h-10 gap-2">
					<Upload className="size-4" />
					Importar arquivo
				</Button>
			</div>

			<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
				<Tabs value={screen.direction} onValueChange={(value) => screen.setDirection(value as PendingDirection | "ALL")}>
					<TabsList>
						<TabsTrigger value="ALL">Todas</TabsTrigger>
						<TabsTrigger value="DEBIT">Débitos</TabsTrigger>
						<TabsTrigger value="CREDIT">Créditos</TabsTrigger>
					</TabsList>
				</Tabs>

				<Select
					value={screen.batch === undefined ? ALL_BATCHES : String(screen.batch)}
					onValueChange={(value) => screen.setBatch(value === ALL_BATCHES ? undefined : Number(value))}
					items={batchOptions}
				>
					<SelectTrigger className="w-full lg:w-80" aria-label="Arquivo de origem">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{batchOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
						))}
					</SelectContent>
				</Select>

				<label className="flex items-center gap-2 text-sm">
					<Checkbox
						checked={screen.cardPaymentsOnly}
						onCheckedChange={(value) => screen.setCardPaymentsOnly(Boolean(value))}
					/>
					Só pagamentos de fatura
				</label>
			</div>

			{selected.size > 0 && (
				<div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
					<span className="text-sm font-medium">{selected.size} selecionada(s)</span>

					<div className="flex flex-wrap items-center gap-2">
						{screen.hasCredit && (
							<span className="text-xs text-muted-foreground">
								Créditos só podem ser marcados como lidos.
							</span>
						)}

						<Button
							disabled={screen.hasCredit}
							onClick={() => screen.setRegistering("bulk")}
						>
							Registrar como despesa
						</Button>

						<Button
							variant="outline"
							className="gap-2"
							onClick={() => screen.setDismissing([...selected])}
						>
							<EyeOff className="size-4" />
							Marcar como lidas
						</Button>
					</div>
				</div>
			)}

			<div className="rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-10">
								<Checkbox
									aria-label="Selecionar todas"
									checked={screen.allSelected}
									onCheckedChange={screen.toggleAll}
									disabled={items.length === 0}
								/>
							</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead className="hidden sm:table-cell">Data</TableHead>
							<TableHead className="text-right">Valor</TableHead>
							<TableHead className="w-48 text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{loading && (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell>
							</TableRow>
						)}

						{!loading && items.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
									Nenhuma pendência. Envie um extrato ou uma fatura para começar.
								</TableCell>
							</TableRow>
						)}

						{!loading && items.map((item) => {
							const credit = item.direction === "CREDIT"
							const Icon = credit ? ArrowUpRight : ArrowDownRight

							return (
								<TableRow key={item.id} data-state={selected.has(item.id) ? "selected" : undefined}>
									<TableCell>
										<Checkbox
											aria-label="Selecionar linha"
											checked={selected.has(item.id)}
											onCheckedChange={() => screen.toggle(item.id)}
										/>
									</TableCell>

									<TableCell className="max-w-0 min-w-48">
										<div className="flex items-center gap-2">
											<Icon className={cn("size-4 shrink-0", credit ? "text-income" : "text-expense-strong")} />
											{/* O texto vem do banco: é sempre exibido como texto, nunca como HTML. */}
											<span className="truncate font-medium">{item.description || item.kind || "Sem descrição"}</span>
										</div>

										<div className="flex flex-wrap items-center gap-1.5 pl-6 text-xs text-muted-foreground sm:hidden">
											{formatPendingDate(item.occurred_at)}
										</div>

										{(item.flag === "CARD_PAYMENT" || item.source_category) && (
											<div className="flex flex-wrap gap-1.5 pt-1 pl-6">
												{item.flag === "CARD_PAYMENT" && (
													<Badge variant="outline">Provável pagamento de fatura</Badge>
												)}
												{item.source_category && <Badge variant="secondary">{item.source_category}</Badge>}
											</div>
										)}
									</TableCell>

									<TableCell className="hidden whitespace-nowrap sm:table-cell">
										{formatPendingDate(item.occurred_at)}
									</TableCell>

									<TableCell className={cn("text-right font-semibold whitespace-nowrap tabular-nums", credit && "text-income")}>
										{credit ? "+ " : ""}{formatCurrency(Number(item.amount))}
									</TableCell>

									<TableCell>
										<div className="flex justify-end gap-1">
											{!credit && (
												<Button size="sm" onClick={() => screen.setRegistering(item)}>
													Registrar
												</Button>
											)}
											<Button
												size="sm"
												variant="ghost"
												aria-label="Marcar como lida"
												onClick={() => screen.setDismissing([item.id])}
											>
												<EyeOff className="size-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</div>

			{registering && (
				<RegisterPendingDialog
					key={registering === "bulk" ? "bulk" : registering.id}
					open
					pending={registering === "bulk" ? undefined : registering}
					ids={registering === "bulk" ? [...selected] : undefined}
					onClose={() => screen.setRegistering(undefined)}
					onSuccess={screen.reload}
				/>
			)}

			<DismissPendingDialog
				count={dismissing?.length}
				onConfirm={screen.confirmDismiss}
				onClose={() => screen.setDismissing(undefined)}
			/>
		</section>
	)
}
