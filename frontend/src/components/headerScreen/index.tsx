import { ReactNode } from "react"

interface HeaderScreenProps {
	title: string
	subtitle: string
	children?: ReactNode
}

export const HeaderScreen = ({
	title,
	subtitle,
	children,
}: HeaderScreenProps) => {
	return (
		<div className="flex gap-4 flex-row items-center justify-center">
			<div className="min-w-0 flex-1">
				<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
					{title}
				</h1>

				<p className="text-muted-foreground">
					{subtitle}
				</p>
			</div>

			{children && (
				<div className="w-auto shrink-0">
					{children}
				</div>
			)}
		</div>
	)
}