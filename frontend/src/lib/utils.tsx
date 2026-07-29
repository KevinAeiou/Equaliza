import { ApiError, ErrorResponse } from "../types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PeriodType } from "../features/dashboard/schemas/filters.schema"
import { endOfDay, endOfMonth, endOfWeek, endOfYear, startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns"
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { AxiosError } from "axios"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function configureError(
	error: unknown,
	message: string,
): never {
	const axiosError = error as AxiosError<ErrorResponse>

	const errorPayload: ApiError = {
		status: axiosError.response?.status ?? 500,
		statusText:
			axiosError.response?.statusText ?? `Falha ao ${message}`,
		message: configureErrorMessage(axiosError, message),
		originalError: axiosError,
	}

	throw errorPayload
}

function configureErrorMessage(
	error: AxiosError<ErrorResponse>,
	message: string,
): string {
	const responseData = error.response?.data

	if (!responseData) {
		return error.message || `Erro desconhecido ao ${message}`
	}

	if (responseData.detail) {
		return responseData.detail
	}

	for (const value of Object.values(responseData)) {
		if (Array.isArray(value) && value.length > 0) {
			return value[0]
		}

		if (typeof value === "string") {
			return value
		}
	}

	return "Erro desconhecido! Contate o suporte ou tente novamente."
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

export function getPeriod(type: PeriodType) {
	const today = new Date()

	switch (type) {
		case PeriodType.DAY:
			return {
				from: startOfDay(today),
				to: endOfDay(today),
			}

		case PeriodType.WEEK:
			return {
				from: startOfWeek(today, { weekStartsOn: 0 }),
				to: endOfWeek(today, { weekStartsOn: 0 }),
			}

		case PeriodType.MONTH:
			return {
				from: startOfMonth(today),
				to: endOfMonth(today),
			}

		case PeriodType.YEAR:
			return {
				from: startOfYear(today),
				to: endOfYear(today),
			}

		default:
			return {
				from: startOfMonth(today),
				to: endOfMonth(today),
			}
	}
}

export function applyApiValidationErrors<T extends FieldValues>(
	form: UseFormReturn<T>,
	error: ApiError,
) {
	const errors = error.originalError?.response?.data

	if (!errors) {
		return false
	}

	Object.entries(errors).forEach(([field, messages]) => {
		if (!messages) {
			return
		}

		const message = Array.isArray(messages) ? messages[0] : messages

		if (message) {
			form.setError(field as FieldPath<T>, {
				type: "server",
				message,
			})
		}
	})

	return true
}