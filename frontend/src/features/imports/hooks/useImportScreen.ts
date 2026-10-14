import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { isApiError } from "@/src/lib/utils"
import { ApiError } from "@/src/types"
import {
	CsvMappingPayload,
	CsvMappingProps,
	ImportBatchProps,
	ImportSource,
	PdfPreviewProps,
	StatementRowProps,
} from "@/src/types"
import { importsApi, notifyPendingChanged } from "../infra/imports"

export const isPdf = (file: File) => file.name.toLowerCase().endsWith(".pdf")

const errorCode = (error: ApiError) => error.originalError?.response?.data?.code

const errorHeaders = (error: ApiError): string[] => {
	const headers = (error.originalError?.response?.data as { headers?: string[] } | undefined)?.headers

	return Array.isArray(headers) ? headers : []
}

export const useImportScreen = () => {
	const [file, setFile] = useState<File | undefined>(undefined)
	const [source, setSource] = useState<ImportSource>("STATEMENT")
	const [password, setPassword] = useState("")
	const [passwordNeeded, setPasswordNeeded] = useState(false)
	const [mapping, setMapping] = useState<number | undefined>(undefined)
	const [mappings, setMappings] = useState<CsvMappingProps[]>([])
	const [mappingHeaders, setMappingHeaders] = useState<string[] | undefined>(undefined)
	const [uploading, setUploading] = useState(false)
	const [result, setResult] = useState<ImportBatchProps | undefined>(undefined)
	const [batches, setBatches] = useState<ImportBatchProps[]>([])
	const [removing, setRemoving] = useState<ImportBatchProps | undefined>(undefined)
	// Extrato em PDF: as linhas lidas esperam a revisão do usuário antes de serem gravadas.
	const [preview, setPreview] = useState<PdfPreviewProps | undefined>(undefined)

	const loadBatches = useCallback(() => {
		importsApi.listBatches().then(setBatches).catch(() => setBatches([]))
	}, [])

	useEffect(() => {
		loadBatches()
		importsApi.listMappings().then(setMappings).catch(() => setMappings([]))
	}, [loadBatches])

	const chooseFile = (next?: File) => {
		setFile(next)
		setResult(undefined)
		setPasswordNeeded(false)
		setPassword("")
	}

	const upload = async (mappingId = mapping) => {
		if (!file) return

		setUploading(true)

		try {
			if (isPdf(file)) {
				setPreview(await importsApi.previewPdf(file, password || undefined))
				setPasswordNeeded(false)
				return
			}

			const batch = await importsApi.upload({
				file,
				source,
				password: password || undefined,
				mapping: mappingId,
			})

			setResult(batch)
			setFile(undefined)
			setPassword("")
			setPasswordNeeded(false)
			notifyPendingChanged()
			loadBatches()
		} catch (error) {
			if (!isApiError(error)) {
				toast.error("Não foi possível enviar o arquivo.")
				return
			}

			const code = errorCode(error)

			if (code === "password_required" || code === "wrong_password") {
				setPasswordNeeded(true)
			}

			if (code === "needs_mapping") {
				setMappingHeaders(errorHeaders(error))
				return
			}

			toast.error(error.message)
		} finally {
			setUploading(false)
		}
	}

	const finishImport = (batch: ImportBatchProps) => {
		setResult(batch)
		setFile(undefined)
		setPassword("")
		setPasswordNeeded(false)
		setPreview(undefined)
		notifyPendingChanged()
		loadBatches()
	}

	const confirmPreview = async (rows: StatementRowProps[]) => {
		if (!preview) return

		setUploading(true)

		try {
			finishImport(await importsApi.confirmPdf(rows, preview.account_ref))
		} catch (error) {
			toast.error(isApiError(error) ? error.message : "Não foi possível importar o extrato.")
		} finally {
			setUploading(false)
		}
	}

	const saveMapping = async (payload: CsvMappingPayload) => {
		const saved = await importsApi.createMapping(payload)

		setMappings((current) => [...current, saved])
		setMapping(saved.id)
		setMappingHeaders(undefined)

		await upload(saved.id)
	}

	const confirmRemove = async () => {
		if (!removing) return

		try {
			await importsApi.deleteBatch(removing.id)
			toast.success("Importação removida.")
			notifyPendingChanged()
			loadBatches()
		} catch (error) {
			toast.error(isApiError(error) ? error.message : "Erro ao remover a importação")
		} finally {
			setRemoving(undefined)
		}
	}

	return {
		file, chooseFile,
		source, setSource,
		password, setPassword, passwordNeeded,
		mapping, setMapping, mappings,
		mappingHeaders, setMappingHeaders, saveMapping,
		uploading, upload, result,
		preview, cancelPreview: () => setPreview(undefined), confirmPreview,
		batches, removing, setRemoving, confirmRemove,
	}
}
