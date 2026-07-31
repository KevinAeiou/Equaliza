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
								<TableHead key={header.id}>
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
									<TableCell key={cell.id}>
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