"use client"

import Link from "next/link"
import { ChangeEvent, DragEvent, useRef, useState } from "react"
import { ArrowLeft, FileUp, Trash2 } from "lucide-react"
import { HeaderScreen } from "@/src/components/headerScreen"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/src/components/ui/alert-dialog"
import { Button } from "@/src/components/ui/button"
import { Field, FieldLabel } from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/src/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { cn } from "@/src/lib/utils"
import { ImportSource } from "@/src/types"
import { useImportScreen } from "../hooks/useImportScreen"
import { batchLabel } from "../utils"
import { MappingDialog } from "./MappingDialog"

const NO_MAPPING = "NONE"

export const ImportScreen = () => {
	const screen = useImportScreen()
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragging, setDragging] = useState(false)
	const { result } = screen

	const onDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		setDragging(false)
		screen.chooseFile(event.dataTransfer.files[0])
	}

	const mappingItems = [
		{ value: NO_MAPPING, label: "Automático (OFX ou CSV de Nubank e C6)" },
		...screen.mappings.map((mapping) => ({ value: String(mapping.id), label: mapping.name })),
	]

	return (
		<section className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-6">
			<Button variant="ghost" className="w-fit gap-2" render={<Link href="/pending" />}>
				<ArrowLeft className="size-4" />
				Pendências
			</Button>

			<HeaderScreen
				title="Importar arquivo"
				subtitle="Envie o extrato ou a fatura baixados no app do seu banco (OFX ou CSV)."
			/>

			<div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6">
				<Tabs value={screen.source} onValueChange={(value) => screen.setSource(value as ImportSource)}>
					<TabsList>
						<TabsTrigger value="STATEMENT">Extrato da conta</TabsTrigger>
						<TabsTrigger value="CARD_INVOICE">Fatura do cartão</TabsTrigger>
					</TabsList>
				</Tabs>

				<div
					onDragOver={(event) => {
						event.preventDefault()
						setDragging(true)
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={onDrop}
					className={cn(
						"flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
						dragging ? "border-primary bg-muted" : "border-border"
					)}
				>
					<FileUp className="size-8 text-muted-foreground" />

					{screen.file ? (
						<p className="text-sm font-medium break-all">{screen.file.name}</p>
					) : (
						<p className="text-sm text-muted-foreground">Arraste o arquivo aqui ou escolha no seu computador.</p>
					)}

					<input
						ref={inputRef}
						type="file"
						accept=".ofx,.csv,.zip,text/csv,application/zip"
						className="hidden"
						onChange={(event: ChangeEvent<HTMLInputElement>) => screen.chooseFile(event.target.files?.[0])}
					/>

					<Button variant="outline" onClick={() => inputRef.current?.click()}>
						Escolher arquivo
					</Button>
				</div>

				<Field>
					<FieldLabel htmlFor="import-password">
						Senha do arquivo {screen.passwordNeeded ? "(obrigatória)" : "(só se houver, como a fatura do C6)"}
					</FieldLabel>
					<Input
						id="import-password"
						type="password"
						autoComplete="off"
						value={screen.password}
						maxLength={128}
						aria-invalid={screen.passwordNeeded}
						onChange={(event) => screen.setPassword(event.target.value)}
					/>
				</Field>

				{screen.mappings.length > 0 && (
					<Field>
						<FieldLabel>Modelo do CSV</FieldLabel>
						<Select
							value={screen.mapping === undefined ? NO_MAPPING : String(screen.mapping)}
							onValueChange={(value) => screen.setMapping(value === NO_MAPPING ? undefined : Number(value))}
							items={mappingItems}
						>
							<SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
							<SelectContent>
								{mappingItems.map((item) => (
									<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				)}

				<Button disabled={!screen.file || screen.uploading} onClick={() => screen.upload()}>
					{screen.uploading ? "Enviando..." : "Importar"}
				</Button>

				<p className="text-xs text-muted-foreground">
					O arquivo é lido na hora e não é guardado. Só ficam as linhas, por até 60 dias, e a descrição é
					guardada cifrada. Apague o arquivo da pasta de downloads depois do envio.
				</p>
			</div>

			{result && (
				<div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:p-6" role="status">
					<h2 className="font-semibold">Importação concluída</h2>
					<p className="text-sm text-muted-foreground">
						{result.rows_new} nova(s) · {result.rows_duplicated} já importada(s)
					</p>
					<Button className="w-fit" render={<Link href="/pending" />}>Ver pendências</Button>
				</div>
			)}

			{screen.batches.length > 0 && (
				<div className="flex flex-col gap-2">
					<h2 className="text-lg font-semibold">Importações anteriores</h2>

					<ul className="divide-y rounded-xl border bg-card">
						{screen.batches.map((batch) => (
							<li key={batch.id} className="flex items-center justify-between gap-3 p-3 text-sm">
								<span className="min-w-0 truncate">{batchLabel(batch)}</span>

								<Button
									variant="ghost"
									size="sm"
									aria-label="Remover importação"
									onClick={() => screen.setRemoving(batch)}
								>
									<Trash2 className="size-4" />
								</Button>
							</li>
						))}
					</ul>
				</div>
			)}

			{screen.mappingHeaders && (
				<MappingDialog
					headers={screen.mappingHeaders}
					onSave={screen.saveMapping}
					onClose={() => screen.setMappingHeaders(undefined)}
				/>
			)}

			<AlertDialog open={Boolean(screen.removing)} onOpenChange={(value) => !value && screen.setRemoving(undefined)}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Remover importação?</AlertDialogTitle>
						<AlertDialogDescription>
							As pendências ainda não tratadas deste arquivo saem da lista. As despesas já registradas continuam
							em Finanças.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel variant="outline" onClick={() => screen.setRemoving(undefined)}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={screen.confirmRemove}>
							Remover
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
