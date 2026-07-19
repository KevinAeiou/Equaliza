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
		<div className="flex items-start justify-between">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					{title}
				</h1>

				<p className="text-muted-foreground">
					{subtitle}
				</p>
			</div>

			{children}
		</div>
	)
}