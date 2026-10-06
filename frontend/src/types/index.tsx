import z from "zod"
import { FormLoginSchema } from "../features/auth/schemas/login.shema"
import { FormRegisterSchema } from "../features/auth/schemas/register.shema"
import { ProfileFormSchemaType } from "../schemas/profile.schema"
import { AxiosError } from "axios"

export enum UserRole {
	ADMIN = "Administrador",
	OWNER = "Responsável",
	MEMBER = "Membro",
}

export interface ProtectedRouteProps {
	children: React.ReactNode
	role?: UserRole[] | undefined
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

export interface FamilyOverviewProps extends FamilyProps {
	role: UserRole | null
	is_active_member: boolean
	members_count: number
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
	role: UserRole
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
	created_at: string
	expires_at: string,
	accepted_at: string | null
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
	type: FinanceEntryType
	is_default?: boolean
	usage_count?: number | null
}

export interface FinanceAuthorProps {
	id: number
	name: string
}

export interface ExpenseProps {
	id: number
	amount: number
	date: string
	category: CategoryProps
	created_by: FinanceAuthorProps | null
	created_at?: string
	updated_at?: string
	description?: string
}

export interface IncomeProps {
	id: number
	amount: number
	date: string
	category: CategoryProps
	created_by: FinanceAuthorProps | null
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

export type RecurrenceFrequency = "WEEKLY" | "MONTHLY" | "YEARLY"

export interface RecurringProps {
	id: number
	type: FinanceEntryType
	amount: number
	description?: string
	category: CategoryProps
	frequency: RecurrenceFrequency
	start_date: string
	end_date: string | null
	next_date: string
	is_active: boolean
	created_by: FinanceAuthorProps | null
	created_at?: string
	updated_at?: string
}

export interface RecurringCreatePayload {
	type: FinanceEntryType
	amount: number
	description?: string
	category: number
	frequency: RecurrenceFrequency
	start_date: string
	end_date: string | null
}

export interface RecurringUpdatePayload {
	amount: number
	description?: string
	category: number
	end_date: string | null
	is_active?: boolean
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

export interface CategoryPayload {
	name: string
	type: FinanceEntryType
}

export interface DashboardChartsProps {
	income_vs_expense: {
		month: string
		period: string
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

export type InsightTone = "alert" | "warning" | "neutral" | "good"

export type InsightKind =
	| "above_average"
	| "below_average"
	| "drop"
	| "rise"
	| "total_change"
	| "largest_expense"
	| "trend"
	| "concentration"
	| "savings"
	| "projection"
	| "weekday"
	| "upcoming"

export interface DashboardInsightProps {
	kind: InsightKind
	tone: InsightTone
	tag: string
	title: string
	body: string
	bars: {
		label: string
		value: string
		fraction: number
		highlighted: boolean
	}[]
	progress: {
		fraction: number
		start: string
		end: string
	} | null
	spark: {
		label: string
		value: string
		fraction: number
		highlighted: boolean
	}[]
	note: string | null
}

export interface DashboardInsightsReportProps {
	insights: DashboardInsightProps[]
	comparisons: {
		name: string
		value: number
		average: number | null
		change: number | null
	}[]
	has_expenses: boolean
	has_history: boolean
	has_previous: boolean
	history_periods: number
	average_label: string
	above_count: number
	below_count: number
	dropped_count: number
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

export interface DashboardInsightsParams {
	from_date: string
	to_date: string
	period_type: string
	categories?: number[]
}

export interface FinanceParams {
	from_date?: string
	to_date?: string
	categories?: number[]
}

export interface CategoryParams {
	name: string
	type: string
}

export interface MemberProps {
	id: number
	name: string
	email: string
	role: string
	avatar: string
	joined_at: string
	is_active: boolean
}

export type ErrorResponse = {
	detail?: string
} & Record<string, string | string[] | undefined>

export const userInitialState = {} as UserProps

export type FormLoginSchemaType = z.infer<typeof FormLoginSchema>
export type FormRegisterShemaType = z.infer<typeof FormRegisterSchema>