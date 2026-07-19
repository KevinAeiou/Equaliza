"use client"

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"

import {
	AuthContextType,
	Credentials,
	FormRegisterShemaType,
	userInitialState,
	UserProps,
} from "@/src/types"

import { AuthService } from "../services/auth.service"
import { ProfileFormSchemaType } from "@/src/schemas/profile.schema"

const AuthContext = createContext({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [user, setUser] = useState<UserProps>(userInitialState)
	const [authLoading, setAuthLoading] = useState<boolean>(true)

	const isLoggedIn = Boolean(user.id)

	const refreshUser = useCallback(async () => {
		try {
			const authenticatedUser = await AuthService.getAuthenticatedUser()

			setUser(authenticatedUser)

			return authenticatedUser
		} catch {
			setUser(userInitialState)
			throw new Error("Não foi possível atualizar o usuário.")
		}
	}, [])

	const login = useCallback(
		async (credentials: Credentials) => {
			const authenticatedUser =
				await AuthService.login(credentials)

			setUser(authenticatedUser)
		},
		[],
	)

	const logout = useCallback(async () => {
		await AuthService.logout()

		setUser(userInitialState)
	}, [])

	const register = useCallback(
		async (data: FormRegisterShemaType) => {
			await AuthService.register(data)

			await refreshUser()
		},
		[refreshUser],
	)

	const validateInvitation = useCallback(async (token: string) => {
		return AuthService.validateInvitation(token)
	}, [])

	const updateProfile = useCallback(async (data: ProfileFormSchemaType) => {
		const authenticatedUser = await AuthService.updateProfile(data)

		setUser(authenticatedUser)

		return authenticatedUser
	}, [])

	useEffect(() => {
		let isMounted = true

		const loadUser = async () => {
			try {
				const authenticatedUser = await AuthService.getAuthenticatedUser()

				if (isMounted) {
					setUser(authenticatedUser)
				}
			} catch {
				if (isMounted) {
					setUser(userInitialState)
				}
			} finally {
				if (isMounted) {
					setAuthLoading(false)
				}
			}
		}

		void loadUser()

		return () => {
			isMounted = false
		}
	}, [])

	const value = useMemo<AuthContextType>(
		() => ({
			user,
			login,
			logout,
			isLoggedIn,
			authLoading,
			register,
			refreshUser,
			validateInvitation,
			updateProfile,
		}),
		[user, login, logout, isLoggedIn, authLoading, register, refreshUser, validateInvitation, updateProfile],
	)

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}