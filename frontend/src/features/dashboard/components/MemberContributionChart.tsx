"use client"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/src/components/ui/card"
import {
	ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent
} from "@/src/components/ui/chart"
import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	XAxis,
	YAxis
} from "recharts"
import { useMemberContributionChart } from "../hooks/useMemberContributionChart"
import { FormDashboardFilterSchemaType } from "../schemas/filters.schema"

const chartConfig = {
	expected: {
		label: "Esperado",
		color: "hsl(var(--chart-2))",
	},
	paid: {
		label: "Pago",
		color: "hsl(var(--chart-1))",
	},
	positive: {
		label: "Acima do esperado",
		color: "hsl(var(--chart-3))",
	},
	negative: {
		label: "Abaixo do esperado",
		color: "hsl(var(--chart-5))",
	},
} satisfies ChartConfig

type CustomBarShapeProps = {
	x?: number
	y?: number
	width?: number
	height?: number
	payload?: {
		difference: number
	}
}

const DifferenceBar = ({
	x = 0,
	y = 0,
	width = 0,
	height = 0,
	payload,
}: CustomBarShapeProps) => {
	const fill =
		(payload?.difference ?? 0) >= 0
			? "var(--color-positive)"
			: "var(--color-negative)"

	const radius = 6

	const adjustedX = width >= 0 ? x : x + width
	const adjustedWidth = Math.abs(width)

	return (
		<rect
			x={adjustedX}
			y={y}
			width={adjustedWidth}
			height={height}
			rx={radius}
			ry={radius}
			fill={fill}
		/>
	)
}

interface MemberContributionChartProps {
	filters: FormDashboardFilterSchemaType
}

export const MemberContributionChart = ({
	filters,
}: MemberContributionChartProps) => {
	const { chartData } = useMemberContributionChart(filters)

	return (
		<Card className="col-span-full">
			<CardHeader>
				<CardTitle>Contribuição dos membros</CardTitle>

				<CardDescription>
					Compare quanto cada membro deveria contribuir com quanto realmente pagou.
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="grid gap-8 lg:grid-cols-2">
					<ChartContainer
						config={chartConfig}
						className="h-87.5 w-full"
					>
						<ResponsiveContainer>
							<BarChart data={chartData?.member_contributions}>
								<CartesianGrid vertical={false} />

								<XAxis
									dataKey="member"
									tickLine={false}
									axisLine={false}
								/>

								<YAxis
									tickLine={false}
									axisLine={false}
								/>

								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent />}
								/>

								<ChartLegend
									content={<ChartLegendContent />}
								/>

								<Bar
									dataKey="expected"
									name="Esperado: "
									fill="var(--color-expected)"
									radius={[6, 6, 0, 0]}
								/>

								<Bar
									dataKey="paid"
									name="Pago: "
									fill="var(--color-paid)"
									radius={[6, 6, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>

					<ChartContainer
						config={chartConfig}
						className="h-87.5 w-full"
					>
						<ResponsiveContainer>
							<BarChart
								layout="vertical"
								data={chartData?.member_contributions}
							>
								<CartesianGrid horizontal={false} />

								<XAxis type="number" />

								<YAxis
									type="category"
									dataKey="member"
									width={90}
								/>

								<ReferenceLine
									x={0}
									stroke="hsl(var(--border))"
								/>

								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent />}
								/>

								<Bar
									dataKey="difference"
									name="Diferença: "
									shape={<DifferenceBar />}
								/>
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</div>
			</CardContent>
		</Card>
	)
}