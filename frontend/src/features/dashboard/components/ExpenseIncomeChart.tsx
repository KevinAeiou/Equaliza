"use client"

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts"

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

import { useExpenseIncomeChart } from "../hooks/useExpenseIncomeChart"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

const chartConfig = {
	income: {
		label: "Receitas",
		color: "hsl(var(--chart-2))",
	},
	expense: {
		label: "Despesas",
		color: "hsl(var(--chart-5))",
	},
} satisfies ChartConfig

interface ExpenseIncomeChartProps {
	filters: FormDashboardFilterSchemaType
}

export const ExpenseIncomeChart = ({
	filters,
}: ExpenseIncomeChartProps) => {
	const { chartData } = useExpenseIncomeChart(filters)

	return (
		<Card className="col-span-full min-w-0 overflow-hidden">
			<CardHeader>
				<CardTitle>Receitas x Despesas</CardTitle>

				<CardDescription>
					Comparativo mensal das movimentações financeiras da família.
				</CardDescription>
			</CardHeader>

			<CardContent className="min-w-0 overflow-hidden p-4 sm:p-6">
				<div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-6">
					<ChartContainer
						config={chartConfig}
						className="h-87.5 w-full min-w-0 sm:h-100"
					>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData?.income_vs_expense}>
								<CartesianGrid vertical={false} />

								<XAxis
									dataKey="month"
									tickLine={false}
									axisLine={false}
									tick={{ fontSize: 12 }}
								/>

								<YAxis
									tickLine={false}
									axisLine={false}
									tick={{ fontSize: 12 }}
								/>

								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent />}
								/>

								<ChartLegend
									content={<ChartLegendContent />}
								/>

								<Bar
									dataKey="expense"
									name="Despesas: "
									fill="var(--color-expense)"
									radius={[6, 6, 0, 0]}
								/>

								<Bar
									dataKey="income"
									name="Receitas: "
									fill="var(--color-income)"
									radius={[6, 6, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>

					<ChartContainer
						config={chartConfig}
						className="h-87.5 w-full min-w-0 sm:h-100"
					>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								layout="vertical"
								data={chartData?.expenses_by_category}
							>
								<CartesianGrid horizontal={false} />

								<XAxis
									type="number"
									tick={{ fontSize: 12 }}
								/>

								<YAxis
									type="category"
									dataKey="category"
									width={70}
									tick={{ fontSize: 12 }}
									tickFormatter={(value: string) =>
										value.length > 8 ? `${value.slice(0, 8)}…` : value
									}
								/>

								<ChartTooltip
									content={<ChartTooltipContent />}
								/>

								<Bar
									dataKey="value"
									name="Valor: "
									radius={6}
									fill="var(--color-expense)"
								/>
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</div>
			</CardContent>
		</Card>
	)
}