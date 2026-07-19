import { CardAction, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { ReactNode } from "react"

interface FormHeaderFieldProps {
	title: string
	description?: string
	children?: ReactNode
}

export const FormHeaderField = ({
	title,
	description,
	children,
}: FormHeaderFieldProps) => {

	return (
		<CardHeader className="space-y-2">
			<CardTitle className="text-3xl">
				{title}
			</CardTitle>

			<CardDescription>
				{description}
			</CardDescription>

			<CardAction>
				{children}
			</CardAction>
		</CardHeader>
	)
}