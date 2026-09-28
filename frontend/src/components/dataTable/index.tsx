import {
	flexRender,
	type Table as TanStackTable,
} from "@tanstack/react-table"

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/src/components/ui/table"
import { ScrollArea } from "../ui/scroll-area"

declare module "@tanstack/react-table" {
	// Permite que uma coluna defina classes para o cabeçalho e as células (ex.: esconder no mobile).
	// A extensão precisa repetir os parâmetros genéricos da declaração original.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		className?: string
	}
}

interface DataTableProps<TData> {
	table: TanStackTable<TData>
	loading?: boolean
	loadingMessage?: string
	emptyMessage?: string
}

export function DataTable<TData>({
	table,
	loading = false,
	loadingMessage = "Carregando...",
	emptyMessage = "Nenhum registro encontrado.",
}: DataTableProps<TData>) {
	return (
		<ScrollArea className="flex-1 w-full h-full">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									className={header.column.columnDef.meta?.className}
								>
									{header.isPlaceholder
										? null
										: flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>

				<TableBody>
					{loading ? (
						<TableRow>
							<TableCell
								colSpan={table.getVisibleLeafColumns().length}
								className="h-24 text-center"
							>
								{loadingMessage}
							</TableCell>
						</TableRow>
					) : table.getRowModel().rows.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										className={cell.column.columnDef.meta?.className}
									>
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext()
										)}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={table.getVisibleLeafColumns().length}
								className="h-24 text-center"
							>
								{emptyMessage}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</ScrollArea>
	)
}