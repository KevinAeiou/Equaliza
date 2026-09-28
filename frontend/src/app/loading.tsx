export default function Loading() {
	return (
		<div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
			<svg viewBox="0 0 64 64" className="size-14 animate-pulse" aria-hidden="true">
				<rect width="64" height="64" rx="15" fill="var(--brand)" />
				<circle cx="20" cy="21" r="7" fill="#fff" />
				<circle cx="44" cy="21" r="7" fill="#fff" />
				<rect x="9" y="31" width="46" height="5" rx="2.5" fill="#fff" />
				<path d="M32 40.5L38.5 49H25.5Z" fill="#fff" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
			</svg>

			<span className="text-sm text-muted-foreground">Carregando...</span>
		</div>
	)
}
