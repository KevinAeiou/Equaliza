"use client"

import { LucideIcon } from "lucide-react"
import { FormEventHandler, ReactNode } from "react"
import { Button } from "@/src/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/src/components/ui/dialog"
import { cn } from "@/src/lib/utils"

interface FormDialogProps {
	open: boolean
	onClose: () => void
	icon: LucideIcon
	iconClassName?: string
	title: string
	description: string
	formId: string
	onSubmit: FormEventHandler<HTMLFormElement>
	submitLabel: string
	loading?: boolean
	loadingLabel?: string
	size?: "md" | "lg"
	children: ReactNode
}

// Estrutura comum dos diálogos de criar e editar: cabeçalho com ícone, campos e rodapé de ações.
export const FormDialog = ({
	open,
	onClose,
	icon: Icon,
	iconClassName = "bg-muted text-foreground",
	title,
	description,
	formId,
	onSubmit,
	submitLabel,
	loading = false,
	loadingLabel = "Salvando...",
	size = "md",
	children,
}: FormDialogProps) => (
	<Dialog
		open={open}
		onOpenChange={(value) => {
			if (!value) onClose()
		}}
	>
		<DialogContent
			className={cn(
				"flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0",
				size === "lg" ? "sm:max-w-lg" : "sm:max-w-md"
			)}
		>
			<div className="flex items-start gap-3 px-6 pt-6 pb-5 pr-12">
				<span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconClassName)}>
					<Icon className="size-5" />
				</span>

				<div className="flex min-w-0 flex-col gap-1">
					<DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</div>
			</div>

			{/* noValidate: as mensagens de validação vêm do formulário (em português), não do navegador. */}
			<form
				id={formId}
				noValidate
				onSubmit={onSubmit}
				className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6"
			>
				{children}
			</form>

			<div className="grid grid-cols-2 gap-2 border-t bg-muted/40 px-6 py-4 sm:flex sm:justify-end">
				<Button
					type="button"
					variant="outline"
					className="h-10"
					onClick={onClose}
				>
					Cancelar
				</Button>

				<Button
					type="submit"
					form={formId}
					className="h-10"
					disabled={loading}
				>
					{loading ? loadingLabel : submitLabel}
				</Button>
			</div>
		</DialogContent>
	</Dialog>
)
