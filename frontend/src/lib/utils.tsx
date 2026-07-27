import { ApiError, ErrorResponse } from "../types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function configureError(error: unknown, message: string) {
	const axiosError = error as {
		response?: {
			status?: number
			statusText: string
			data?: unknown
		}
		message?: string
	}
	const errorMessage = configureErrorMessage()

	const errorPayload: ApiError = {
		status: axiosError.response?.status || 500,
		statusText: axiosError.response?.statusText || `Falha ao ${message}`,
		message: errorMessage,
		originalError: error,
	}

	throw errorPayload

	function configureErrorMessage(): string {
		if (!axiosError.response?.data) {
			return axiosError.message || `Erro desconhecido ao ${message}`
		}

		const responseData = axiosError.response.data as ErrorResponse

		if (
			typeof responseData === "object" &&
			responseData !== null &&
			"detail" in responseData
		) {
			return String(responseData.detail)
		}

		for (const value of Object.values(responseData)) {
			if (Array.isArray(value) && value.length > 0) {
				return String(value[0])
			}

			if (typeof value === "string") {
				return value
			}
		}

		return "Erro desconhecido! Contate o suporte ou tente novamente."
	}
}

export function isApiError(error: unknown): error is ApiError {
	return typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		'status' in error &&
		'statusText' in error;
}

export function formatCurrency(
	value: number,
	locale = "pt-BR",
	currency = "BRL",
) {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value)
}

export const formatDate = (date: string) =>
	new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	})
		.format(new Date(date))
		.replace(",", "")