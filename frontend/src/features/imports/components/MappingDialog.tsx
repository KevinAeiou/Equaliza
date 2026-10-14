import { Columns3 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { FormDialog } from "@/src/components/formDialog"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/src/components/ui/select"
import { isApiError } from "@/src/lib/utils"
import { CsvMappingPayload } from "@/src/types"

interface MappingDialogProps {
	headers: string[]
	onSave: (payload: CsvMappingPayload) => Promise<void>
	onClose: () => void
}

const DATE_FORMATS = [
	{ value: "%d/%m/%Y", label: "dd/mm/aaaa" },
	{ value: "%Y-%m-%d", label: "aaaa-mm-dd" },
	{ value: "%d-%m-%Y", label: "dd-mm-aaaa" },
] as const

const DECIMALS = [
	{ value: "COMMA", label: "1.234,56" },
	{ value: "DOT", label: "1,234.56" },
] as const

interface ColumnSelectProps {
	label: string
	value: string
	headers: string[]
	onChange: (value: string) => void
}

const ColumnSelect = ({ label, value, headers, onChange }: ColumnSelectProps) => {
	const items = headers.map((header) => ({ value: header, label: header }))

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>

			<Select value={value} onValueChange={(next) => onChange(next ?? "")} items={items}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Selecione a coluna" />
				</SelectTrigger>
				<SelectContent>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	)
}

// O banco não tem modelo pronto: o usuário diz qual coluna é a data, o valor e a descrição (uma vez só).
export const MappingDialog = ({ headers, onSave, onClose }: MappingDialogProps) => {
	const [name, setName] = useState("")
	const [dateColumn, setDateColumn] = useState("")
	const [amountColumn, setAmountColumn] = useState("")
	const [descriptionColumn, setDescriptionColumn] = useState("")
	const [dateFormat, setDateFormat] = useState<CsvMappingPayload["date_format"]>("%d/%m/%Y")
	const [decimal, setDecimal] = useState<CsvMappingPayload["decimal_separator"]>("COMMA")
	const [debitIsNegative, setDebitIsNegative] = useState(true)
	const [loading, setLoading] = useState(false)

	const submit = async () => {
		const columns = new Set([dateColumn, amountColumn, descriptionColumn])

		if (!name.trim() || columns.has("") || columns.size !== 3) {
			toast.error("Dê um nome e escolha uma coluna diferente para data, valor e descrição.")
			return
		}

		setLoading(true)

		try {
			await onSave({
				name: name.trim(),
				date_column: dateColumn,
				amount_column: amountColumn,
				description_column: descriptionColumn,
				date_format: dateFormat,
				decimal_separator: decimal,
				debit_is_negative: debitIsNegative,
			})
		} catch (error) {
			toast.error(isApiError(error) ? error.message : "Erro ao salvar o mapeamento")
		} finally {
			setLoading(false)
		}
	}

	return (
		<FormDialog
			open
			onClose={onClose}
			icon={Columns3}
			title="Mapear colunas do CSV"
			description="Não reconhecemos o modelo deste banco. Diga quais colunas usar; o mapeamento fica salvo para os próximos envios."
			formId="form-csv-mapping"
			onSubmit={(event) => {
				event.preventDefault()
				submit()
			}}
			submitLabel="Salvar e importar"
			loading={loading}
			size="lg"
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="mapping-name">Nome do mapeamento</FieldLabel>
					<Input
						id="mapping-name"
						value={name}
						maxLength={80}
						placeholder="Ex.: Meu banco (extrato)"
						onChange={(event) => setName(event.target.value)}
					/>
				</Field>

				<ColumnSelect label="Coluna da data" value={dateColumn} headers={headers} onChange={setDateColumn} />
				<ColumnSelect label="Coluna do valor" value={amountColumn} headers={headers} onChange={setAmountColumn} />
				<ColumnSelect label="Coluna da descrição" value={descriptionColumn} headers={headers} onChange={setDescriptionColumn} />

				<div className="grid gap-4 sm:grid-cols-2">
					<Field>
						<FieldLabel>Formato da data</FieldLabel>
						<Select value={dateFormat} onValueChange={(value) => setDateFormat(value as typeof dateFormat)} items={[...DATE_FORMATS]}>
							<SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
							<SelectContent>
								{DATE_FORMATS.map((item) => (
									<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					<Field>
						<FieldLabel>Formato do valor</FieldLabel>
						<Select value={decimal} onValueChange={(value) => setDecimal(value as typeof decimal)} items={[...DECIMALS]}>
							<SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
							<SelectContent>
								{DECIMALS.map((item) => (
									<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				</div>

				<label className="flex items-center gap-2 text-sm">
					<Checkbox checked={debitIsNegative} onCheckedChange={(value) => setDebitIsNegative(Boolean(value))} />
					Os débitos (gastos) aparecem com valor negativo
				</label>
			</FieldGroup>
		</FormDialog>
	)
}
