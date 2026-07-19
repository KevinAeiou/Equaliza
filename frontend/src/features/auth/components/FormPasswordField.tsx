"use client"

import { useState } from "react"
import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"

import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"

interface FormPasswordFieldProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
	placeholder?: string
	disabled?: boolean
	autoComplete?: string
}

export const FormPasswordField = <T extends FieldValues,>({
	control,
	name,
	label,
	placeholder,
	disabled = false,
	autoComplete = "current-password",
}: FormPasswordFieldProps<T>) => {
	const [showPassword, setShowPassword] = useState(false)

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={`${name}-field`}>
						{label}
					</FieldLabel>

					<div className="relative">
						<Input
							{...field}
							id={`${name}-field`}
							type={showPassword ? "text" : "password"}
							placeholder={placeholder}
							autoComplete={autoComplete}
							disabled={disabled}
							aria-invalid={fieldState.invalid}
							className="pr-10"
						/>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
							onClick={() => setShowPassword((prev) => !prev)}
							tabIndex={-1}
						>
							{showPassword ? (
								<EyeOff className="size-4" />
							) : (
								<Eye className="size-4" />
							)}
						</Button>
					</div>
					
					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	)
}