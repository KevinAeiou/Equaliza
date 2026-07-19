"use client"

import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/src/components/ui/card"
import { useSummaryCards } from "../hooks/useSummaryCards"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

interface SummaryCardsProps {
	filters: FormDashboardFilterSchemaType
}

export const SummaryCards = ({
	filters,
}: SummaryCardsProps) => {
	const {
		cards,
	} = useSummaryCards(filters)

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{cards.map(({ title, description, value, icon: Icon }) => (
				<Card
					key={title}
					className="transition-all hover:-translate-y-1 hover:shadow-md"
				>
					<CardContent
						className="flex items-center justify-between gap-4 px-4 lg:flex-col lg:items-stretch"
					>
						<div className="flex items-center gap-3 lg:justify-between lg:flex-row-reverse">
							<div className="rounded-lg bg-muted p-2">
								<Icon className="size-5 text-muted-foreground" />
							</div>

							<div>
								<CardTitle className="text-sm font-medium">
									{title}
								</CardTitle>

								<CardDescription>
									{description}
								</CardDescription>
							</div>
						</div>

						<p className="text-right text-3xl font-bold tracking-tight lg:text-left">
							{value}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	)
}