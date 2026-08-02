"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ShieldAlert, Home } from "lucide-react"

import { Button } from "@/src/components/ui/button"

export default function Unauthorized() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-12 text-center">
			<Image
				src="/unauthorized.svg"
				alt="Acesso não autorizado"
				width={320}
				height={320}
				priority
				className="mb-8 max-w-full grayscale opacity-80"
			/>

			<span className="text-sm font-medium uppercase tracking-widest text-primary">
				Erro 403
			</span>

			<h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
				Acesso não autorizado
			</h1>

			<p className="mt-4 max-w-lg text-muted-foreground">
				Você não possui permissão para acessar esta página na família
				atualmente selecionada. Caso acredite que isso seja um erro,
				entre em contato com o responsável ou administrador da família.
			</p>

			<div className="mt-8 flex flex-col gap-3 sm:flex-row">
				<Button>
					<Link
						href="/"
						className="flex items-center justify-center"
					>
						<Home className="mr-2 h-4 w-4" />
						Ir para o início
					</Link>
				</Button>

				<Button
					variant="outline"
					onClick={() => window.history.back()}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
			</div>

			<div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
				<ShieldAlert className="h-4 w-4" />
				Somente administradores e responsáveis podem acessar esta área.
			</div>
		</div>
	)
}