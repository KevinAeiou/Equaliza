interface SparklineProps {
	values: number[]
	className?: string
}

const WIDTH = 96
const HEIGHT = 28
const PADDING = 3

export const Sparkline = ({
	values,
	className,
}: SparklineProps) => {
	if (values.length < 2) return null

	const min = Math.min(...values)
	const range = Math.max(...values) - min || 1

	const points = values.map((value, index) => [
		PADDING + (index * (WIDTH - PADDING * 2)) / (values.length - 1),
		HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2),
	])

	const [lastX, lastY] = points[points.length - 1]

	return (
		<svg
			width={WIDTH}
			height={HEIGHT}
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			className={className}
			aria-hidden="true"
		>
			<polyline
				points={points.map((point) => point.join(",")).join(" ")}
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			<circle cx={lastX} cy={lastY} r={3} fill="currentColor" />
		</svg>
	)
}
