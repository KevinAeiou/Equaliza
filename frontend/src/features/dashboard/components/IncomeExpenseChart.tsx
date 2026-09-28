"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card"
import {
	ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/src/components/ui/chart"
import { cn } from "@/src/lib/utils"
import { TrendPoint } from "../utils"

const chartConfig = {
	income: {
		label: "Receitas",
		color: "var(--income)",
	},
	expense: {
		label: "Despesas",
		color: "var(--expense)",
	},
} satisfies ChartConfig

const compactCurrency = new Intl.NumberFormat("pt-BR", {
	notation: "compact",
	maximumFractionDigits: 1,
})

interface IncomeExpenseChartProps {
	trend?: TrendPoint[]
	className?: string
}

export const IncomeExpenseChart = ({
	trend,
	className,
}: IncomeExpenseChartProps) => {
	const lastIndex = (trend?.length ?? 0) - 1

	return (
		<Card className={cn("min-w-0", className)}>
			<CardHeader>
				<CardTitle className="font-semibold">Receitas x Despesas</CardTitle>

				<CardDescription>
					Comparativo dos últimos 6 meses. O mês mais recente fica em destaque.
				</CardDescription>
			</CardHeader>

			<CardContent className="min-w-0">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-64 w-full sm:h-80"
				>
					<BarChart data={trend} barGap={4}>
						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="label"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>

						<YAxis
							tickLine={false}
							axisLine={false}
							width={44}
							tickFormatter={(value: number) => compactCurrency.format(value)}
						/>

						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent />}
						/>

						<ChartLegend
							verticalAlign="top"
							content={<ChartLegendContent className="justify-end pt-0 pb-4" />}
						/>

						{(["income", "expense"] as const).map((key) => (
							<Bar
								key={key}
								dataKey={key}
								fill={`var(--color-${key})`}
								radius={[4, 4, 0, 0]}
								maxBarSize={24}
							>
								{trend?.map((point, index) => (
									<Cell
										key={point.period}
										fillOpacity={index === lastIndex ? 1 : 0.45}
									/>
								))}
							</Bar>
						))}
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
