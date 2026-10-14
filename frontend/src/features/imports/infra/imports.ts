import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"
import {
	CsvMappingPayload,
	CsvMappingProps,
	ImportBatchProps,
	ImportSource,
	PendingParams,
	PendingProps,
	RegisterPendingPayload,
} from "@/src/types"

interface UploadParams {
	file: File
	source: ImportSource
	password?: string
	mapping?: number
}

const ImportsAPI = () => ({

	// Sem a funcionalidade ligada no servidor, a API responde 404: o menu some.
	pendingCount: async (): Promise<number | null> => {
		try {
			const response = await api<{ count: number }>({
				url: "pending-transactions/",
				params: { page_size: 1 },
			})

			return response.data.count
		} catch {
			return null
		}
	},

	upload: async ({ file, source, password, mapping }: UploadParams): Promise<ImportBatchProps> => {
		const data = new FormData()

		data.append("file", file)
		data.append("source", source)
		if (password) data.append("password", password)
		if (mapping) data.append("mapping", String(mapping))

		try {
			const response = await api<ImportBatchProps>({ url: "imports/", method: "POST", data })

			return response.data
		} catch (error) {
			throw configureError(error, "enviar o arquivo")
		}
	},

	listBatches: async (): Promise<ImportBatchProps[]> => {
		const response = await api<ImportBatchProps[]>({ url: "imports/" })

		return response.data
	},

	deleteBatch: async (id: number): Promise<void> => {
		try {
			await api({ url: `imports/${id}/`, method: "DELETE" })
		} catch (error) {
			throw configureError(error, "remover a importação")
		}
	},

	listMappings: async (): Promise<CsvMappingProps[]> => {
		const response = await api<CsvMappingProps[]>({ url: "imports/csv-mappings/" })

		return response.data
	},

	createMapping: async (data: CsvMappingPayload): Promise<CsvMappingProps> => {
		try {
			const response = await api<CsvMappingProps>({
				url: "imports/csv-mappings/",
				method: "POST",
				data,
			})

			return response.data
		} catch (error) {
			throw configureError(error, "salvar o mapeamento")
		}
	},

	listPending: async (params: PendingParams): Promise<PendingProps[]> => {
		try {
			const response = await api<PendingProps[]>({ url: "pending-transactions/", params })

			return response.data
		} catch (error) {
			throw configureError(error, "listar as pendências")
		}
	},

	register: async (id: number, data: RegisterPendingPayload): Promise<void> => {
		try {
			await api({ url: `pending-transactions/${id}/import/`, method: "POST", data })
		} catch (error) {
			throw configureError(error, "registrar a pendência")
		}
	},

	bulk: async (
		ids: number[],
		action: "import" | "dismiss",
		target?: { family: number, category: number },
	): Promise<number> => {
		try {
			const response = await api<{ processed: number }>({
				url: "pending-transactions/bulk/",
				method: "POST",
				data: { ids, action, ...target },
			})

			return response.data.processed
		} catch (error) {
			throw configureError(error, "atualizar as pendências")
		}
	},
})

export const importsApi = ImportsAPI()

// Avisa o menu (contador de Pendências) que a lista mudou.
export const PENDING_CHANGED_EVENT = "pending:changed"

export const notifyPendingChanged = () => window.dispatchEvent(new Event(PENDING_CHANGED_EVENT))
