import z from "zod"
import { FormLoginSchema } from "../features/auth/schemas/login.shema"
import { FormRegisterSchema } from "../features/auth/schemas/register.shema"
import { ProfileFormSchemaType } from "../schemas/profile.schema"
import { AxiosError } from "axios"

export type UserRole = "client" | "admin" | "super"

export interface ProtectedRouteProps {
	children: React.ReactNode
	role?: UserRole | undefined
}

export interface Credentials {
	email: string
	password: string
}

export interface AuthContextType {
	user: UserProps
	login: (credentials: Credentials) => Promise<void>
	isLoggedIn: boolean
	logout: () => void
	authLoading: boolean
	register: (data: FormRegisterShemaType) => Promise<void>
	refreshUser: () => Promise<UserProps>
	validateInvitation: (token: string) => Promise<InviteValidationProps>
	updateProfile: (data: ProfileFormSchemaType) => Promise<UserProps>
}

export interface ApiResponse<T = unknown> {
	status: number
	statusText: string
	data: T
	meta?: Record<string, unknown>
}

export interface FamilyProps {
	id: number
	name: string
	created_at: string
	updated_at: string
}

export interface AvatarProps {
	id: string
	url: string
}

export interface UserProps {
	id: number
	first_name: string
	last_name: string
	email: string
	role: string
	current_family: FamilyProps
	families: FamilyProps[]
	avatar: AvatarProps
}

export interface InviteValidationProps {
	token: string,
	email: string,
	family: FamilyProps
}

export interface InviteProps {
	id: number
	expires_at: string,
	email: string,
	status: string
	link: string
}

export type ApiValidationErrors = Record<string, string[]>

export interface ApiError {
	status: number
	statusText: string
	message: string
	originalError?: AxiosError<ErrorResponse>
}

export interface CategoryProps {
	id: number
	name: string
	type: string
}

export interface ExpenseProps {
	id: number
	amount: number
	date: string
	category: CategoryProps
	created_at?: string
	updated_at?: string
	description?: string
}

export interface IncomeProps {
	id: number
	amount: number
	date: string
	category: CategoryProps
	created_at?: string
	updated_at?: string
	description?: string
}

export type FinanceEntryType = "EXPENSE" | "INCOME"

export interface FinancialEntry {
	id: number
	type: FinanceEntryType
	category: CategoryProps
	amount: number
	date: string
	description?: string
	createdBy: UserProps
}

export interface SelectOption<T extends string | number = string> {
	label: string
	value: T
}

export interface FinancialPayload {
	amount: number
	category?: number
	date?: string
	description?: string
}

export interface FamilyPayload {
	name: string
}

export interface DashboardChartsProps {
	income_vs_expense: {
		month: string
		income: number
		expense: number
	}[]

	expenses_by_category: {
		category: string
		value: number
	}[]

	member_contributions: {
		member: string
		expected: number
		paid: number
		difference: number
	}[]
}

export interface DashboardRecentTransactionProps {
	id: number
	description: string
	amount: number
	type: FinanceEntryType
	date: string
	category: string
}

export interface MemberBalanceProps {
	member: string
	paid: number
	shouldPay: number
	balance: number
}

export interface DashboardSummaryProps {
	balance: number
	income: number
	expense: number
	members: number
}

export interface DashboardParams {
	from_date?: string
	to_date?: string
	categories?: number[]
}

export interface FinanceParams {
	from_date?: string
	to_date?: string
	categories?: number[]
}

export interface MemberProps {
	id: number
	name: string
	email: string
	role: string
	joined_at: string
	is_active: boolean
}

export type ErrorResponse = {
	detail?: string
} & Record<string, string | string[] | undefined>

export const userInitialState = {} as UserProps

export type FormLoginSchemaType = z.infer<typeof FormLoginSchema>
export type FormRegisterShemaType = z.infer<typeof FormRegisterSchema>