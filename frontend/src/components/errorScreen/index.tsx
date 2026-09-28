"use client"

import { ArrowLeft, Home, Lock, LucideIcon, RotateCw, SearchX, TriangleAlert } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

type Variant = "not-found" | "unauthorized" | "error"

const BADGES: Record<Variant, { icon: LucideIcon, className: string }> = {
	"not-found": { icon: SearchX, className: "text-muted-foreground" },
	unauthorized: { icon: Lock, className: "text-expense-strong" },
	error: { icon: TriangleAlert, className: "text-expense-strong" },
}

// Símbolo da marca: no 404 a balança aparece desequilibrada.
const BrandGlyph = ({ tilted }: { tilted: boolean }) => (
	<svg viewBox="7 12 50 41" className="w-16 text-brand" aria-hidden="true">
		<g transform={tilted ? "rotate(-14 32 33.5)" : undefined}>
			<circle cx="20" cy="21" r="7" fill="currentColor" />
			<circle cx="44" cy="21" r="7" fill="currentColor" />
			<rect x="9" y="31" width="46" height="5" rx="2.5" fill="currentColor" />
		</g>
		<path d="M32 40.5L38.5 49H25.5Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
	</svg>
)

interface ErrorScreenProps {
	variant: Variant
	code: string
	title: string
	description: string
	note?: ReactNode
	onRetry?: () => void
}

export const ErrorScreen = ({
	variant,
	code,
	title,
	description,
	note,
	onRetry,
}: ErrorScreenProps) => {
	const { icon: BadgeIcon, className: badgeClassName } = BADGES[variant]

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<header className="px-4 py-5 sm:px-8">
				<Link href="/dashboard" aria-label="Equaliza, ir para o dashboard" className="inline-flex">
					<Image src="/logo.svg" alt="Equaliza" width={124} height={31} className="block dark:hidden" priority />
					<Image src="/logo-white.svg" alt="Equaliza" width={124} height={31} className="hidden dark:block" priority />
				</Link>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
				<div className="relative mb-8">
					<div className="flex size-28 items-center justify-center rounded-3xl bg-income-soft">
						<BrandGlyph tilted={variant === "not-found"} />
					</div>

					<span className="absolute -right-3 -bottom-3 flex size-11 items-center justify-center rounded-full border bg-background shadow-sm">
						<BadgeIcon className={cn("size-5", badgeClassName)} />
					</span>
				</div>

				<span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
					{code}
				</span>

				<h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
					{title}
				</h1>

				<p className="mt-3 max-w-md text-muted-foreground">
					{description}
				</p>

				<div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
					{onRetry ? (
						<Button className="h-10 gap-2" onClick={onRetry}>
							<RotateCw className="size-4" />
							Tentar novamente
						</Button>
					) : (
						<Link href="/dashboard" className={cn(buttonVariants(), "h-10 gap-2")}>
							<Home className="size-4" />
							Ir para o dashboard
						</Link>
					)}

					<Button
						variant="outline"
						className="h-10 gap-2"
						onClick={() => window.history.back()}
					>
						<ArrowLeft className="size-4" />
						Voltar
					</Button>
				</div>

				{note && (
					<p className="mt-8 max-w-md text-sm text-muted-foreground">{note}</p>
				)}
			</main>
		</div>
	)
}
