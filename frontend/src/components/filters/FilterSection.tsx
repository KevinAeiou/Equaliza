import { ReactNode } from "react"

interface FilterSectionProps {
	title: string
	hint?: string
	children: ReactNode
}

export const FilterSection = ({
	title,
	hint,
	children,
}: FilterSectionProps) => (
	<fieldset className="flex min-w-0 flex-col gap-3">
		<legend className="mb-3 flex w-full items-baseline justify-between gap-2">
			<span className="text-sm font-semibold">{title}</span>
			{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
		</legend>

		{children}
	</fieldset>
)
