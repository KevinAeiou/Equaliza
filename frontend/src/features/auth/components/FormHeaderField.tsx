import { ReactNode } from "react"

interface FormHeaderFieldProps {
	title: string
	description?: ReactNode
	children?: ReactNode
}

export const FormHeaderField = ({
	title,
	description,
	children,
}: FormHeaderFieldProps) => {

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
				{title}
			</h2>

			{description && (
				<p className="text-sm text-muted-foreground">
					{description}
				</p>
			)}

			{children}
		</div>
	)
}
