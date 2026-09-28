import { HandCoins, Scale, Users } from "lucide-react"
import Image from "next/image"
import { ReactNode } from "react"

const HIGHLIGHTS = [
	{ icon: Users, text: "Receitas e despesas de toda a família em um só lugar." },
	{ icon: Scale, text: "Cada pessoa contribui de acordo com a própria renda." },
	{ icon: HandCoins, text: "Saiba quem precisa acertar quanto para equilibrar as contas." },
]

interface AuthShellProps {
	children: ReactNode
}

// Moldura das telas públicas: painel da marca à esquerda (desktop) e conteúdo à direita.
export const AuthShell = ({ children }: AuthShellProps) => (
	<div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
		<aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-brand-foreground lg:flex">
			<Image
				src="/logo-white.svg"
				alt="Equaliza"
				width={180}
				height={44}
				priority
			/>

			<div className="relative z-10 flex max-w-md flex-col gap-8">
				<h1 className="text-4xl leading-tight font-semibold tracking-tight">
					As finanças da família, divididas de forma justa.
				</h1>

				<ul className="flex flex-col gap-4">
					{HIGHLIGHTS.map(({ icon: Icon, text }) => (
						<li key={text} className="flex items-start gap-3 text-base text-white/85">
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
								<Icon className="size-4 text-white" />
							</span>
							<span className="pt-1">{text}</span>
						</li>
					))}
				</ul>
			</div>

			<p className="relative z-10 text-sm text-white/70">Equaliza · gestor de finanças familiar</p>

			{/* Símbolo da marca ao fundo, apenas decorativo. */}
			<svg
				aria-hidden="true"
				viewBox="7 12 50 41"
				className="pointer-events-none absolute -right-24 -bottom-16 w-[28rem] text-white opacity-[0.07]"
			>
				<circle cx="20" cy="21" r="7" fill="currentColor" />
				<circle cx="44" cy="21" r="7" fill="currentColor" />
				<rect x="9" y="31" width="46" height="5" rx="2.5" fill="currentColor" />
				<path d="M32 40.5L38.5 49H25.5Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
			</svg>
		</aside>

		<main className="flex items-center justify-center px-4 py-10 sm:px-8">
			<div className="flex w-full max-w-sm flex-col gap-8">
				<div className="lg:hidden">
					<Image
						src="/logo.svg"
						alt="Equaliza"
						width={160}
						height={40}
						className="block dark:hidden"
						priority
					/>

					<Image
						src="/logo-white.svg"
						alt="Equaliza"
						width={160}
						height={40}
						className="hidden dark:block"
						priority
					/>
				</div>

				{children}
			</div>
		</main>
	</div>
)
