import { Field, FieldError, FieldLabel } from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"

interface FormCurrencyFieldProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
	placeholder?: string
	disabled?: boolean
	max?: number
}

const formatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
})

export const FormCurrencyField = <T extends FieldValues>({
	control,
	name,
	label,
	placeholder = "R$ 0,00",
	disabled = false,
	max = 1_100_000,
}: FormCurrencyFieldProps<T>) => {
	const maxInCents = Math.round(max * 100)

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const value = Number(field.value ?? 0)
				const cents = Math.round(value * 100)

				return (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={`${name}-field`}>
							{label}
						</FieldLabel>

						<Input
							id={`${name}-field`}
							value={formatter.format(value)}
							placeholder={placeholder}
							disabled={disabled}
							inputMode="numeric"
							autoComplete="off"
							className="text-right tabular-nums"
							aria-invalid={fieldState.invalid}
							onBlur={field.onBlur}
							ref={field.ref}
							onKeyDown={(e) => {
								if (
									e.ctrlKey ||
									e.metaKey ||
									e.altKey
								) {
									return
								}

								if (
									[
										"Tab",
										"Shift",
										"ArrowLeft",
										"ArrowRight",
										"ArrowUp",
										"ArrowDown",
										"Home",
										"End",
									].includes(e.key)
								) {
									return
								}

								e.preventDefault()

								if (e.key === "Backspace") {
									const next = Math.floor(cents / 10)

									field.onChange(next / 100)
									return
								}

								if (e.key === "Delete") {
									field.onChange(0)
									return
								}

								if (!/^\d$/.test(e.key)) {
									return
								}

								let next = cents * 10 + Number(e.key)

								if (next > maxInCents) {
									next = maxInCents
								}

								field.onChange(next / 100)
							}}
							onPaste={(e) => {
								e.preventDefault()

								const pasted = e.clipboardData.getData("text")

								const digits = pasted.replace(/\D/g, "")

								if (!digits) return

								const next = Math.min(
									Number(digits),
									maxInCents
								)

								field.onChange(next / 100)
							}}
							onFocus={(e) => {
								requestAnimationFrame(() => {
									const length = e.target.value.length
									e.target.setSelectionRange(length, length)
								})
							}}
							onClick={(e) => {
								const length = e.currentTarget.value.length
								e.currentTarget.setSelectionRange(length, length)
							}}
							readOnly
						/>

						<FieldError errors={[fieldState.error]} />
					</Field>
				)
			}}
		/>
	)
}