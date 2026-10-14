import { useState } from "react"
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Input } from "@/src/components/ui/input"
import { cn, formatCurrency } from "@/src/lib/utils"
import { PdfPreviewProps, StatementRowProps } from "@/src/types"
import { formatPendingDate } from "../utils"

interface PdfReviewProps {
	preview: PdfPreviewProps
	loading: boolean
	onConfirm: (rows: StatementRowProps[]) => void
	onCancel: () => void
}

const money = (value: string | null) => (value === null ? "—" : formatCurrency(Number(value)))

// Revisão obrigatória: o PDF é lido por heurística, então nada é gravado antes de o usuário conferir.
export const PdfReview = ({ preview, loading, onConfirm, onCancel }: PdfReviewProps) => {
	const [rows, setRows] = useState<StatementRowProps[]>(preview.rows)
	const [acknowledged, setAcknowledged] = useState(false)

	const matches = preview.matches
	const edited = rows.length !== preview.rows.length || rows.some((row, index) => row.description !== preview.rows[index]?.description)
	// Se o total não confere (ou o usuário mexeu nas linhas), ele precisa confirmar de forma explícita.
	const needsAck = matches !== true || edited

	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6">
			<div>
				<h2 className="text-lg font-semibold">Revise o extrato antes de importar</h2>
				<p className="text-sm text-muted-foreground">
					{formatPendingDate(preview.period_start)} a {formatPendingDate(preview.period_end)} · {rows.length} linha(s). Nada foi gravado ainda.
				</p>
			</div>

			<div
				role="status"
				className={cn(
					"flex items-start gap-2 rounded-lg border p-3 text-sm",
					matches === true ? "border-income/40 bg-income-soft" : "border-amber-500/40 bg-amber-500/10"
				)}
			>
				{matches === true
					? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-income" />
					: <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />}

				<div className="flex flex-col gap-1">
					{matches === true && <span>Os totais lidos conferem com os do extrato.</span>}
					{matches === false && <span className="font-medium">Os totais lidos não batem com os do extrato. Alguma linha pode ter ficado de fora ou ter sido lida errado.</span>}
					{matches === null && <span className="font-medium">O PDF não traz totais para conferir. Confira as linhas com atenção.</span>}
					<span className="text-muted-foreground">
						Lido: entradas {money(preview.parsed_in)} · saídas {money(preview.parsed_out)}
						{matches !== null && <> — Extrato: entradas {money(preview.pdf_in)} · saídas {money(preview.pdf_out)}</>}
					</span>
				</div>
			</div>

			<ul className="max-h-96 divide-y overflow-auto rounded-lg border">
				{rows.map((row, index) => {
					const credit = row.direction === "CREDIT"

					return (
						<li key={index} className="flex items-center gap-2 p-2 text-sm">
							<span className="w-20 shrink-0 text-muted-foreground">{formatPendingDate(row.date)}</span>

							<Input
								aria-label="Descrição"
								value={row.description}
								maxLength={500}
								onChange={(event) =>
									setRows((current) => current.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)))
								}
							/>

							<span className={cn("w-28 shrink-0 text-right font-semibold tabular-nums", credit && "text-income")}>
								{credit ? "+ " : ""}{formatCurrency(Number(row.amount))}
							</span>

							<Button
								variant="ghost"
								size="sm"
								aria-label="Remover linha"
								onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
							>
								<Trash2 className="size-4" />
							</Button>
						</li>
					)
				})}
			</ul>

			{needsAck && (
				<label className="flex items-start gap-2 text-sm">
					<Checkbox checked={acknowledged} onCheckedChange={(value) => setAcknowledged(Boolean(value))} />
					<span>Conferi as linhas e quero importar{matches === true ? "" : " mesmo com a diferença nos totais"}.</span>
				</label>
			)}

			<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
				<Button variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
				<Button
					disabled={loading || rows.length === 0 || (needsAck && !acknowledged)}
					onClick={() => onConfirm(rows)}
				>
					{loading ? "Importando..." : `Importar ${rows.length} linha(s)`}
				</Button>
			</div>
		</div>
	)
}
