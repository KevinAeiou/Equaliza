"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

import { Button } from "@/src/components/ui/button"

export default function NotFound() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-12 text-center">
			<Image
				src="/not-found.svg"
				alt="Página não encontrada"
				width={320}
				height={320}
				priority
				className="mb-8 max-w-full grayscale opacity-80"
			/>

			<span className="text-sm font-medium uppercase tracking-widest text-primary">
				Erro 404
			</span>

			<h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
				Página não encontrada
			</h1>

			<p className="mt-4 max-w-lg text-muted-foreground">
				Não foi possível encontrar a página que você está procurando.
				Ela pode ter sido movida, removida ou o endereço informado está incorreto.
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
		</div>
	)
}