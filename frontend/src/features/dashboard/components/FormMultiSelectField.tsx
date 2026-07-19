import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"

import {
	Check,
	ChevronsUpDown,
} from "lucide-react"

import {
	Button,
} from "@/src/components/ui/button"

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/src/components/ui/command"

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/src/components/ui/popover"

import {
	Field,
	FieldError,
	FieldLabel,
} from "@/src/components/ui/field"

import {
	SelectOption,
} from "@/src/types"


interface FormMultiSelectFieldProps<
	TField extends FieldValues,
	TValue extends string | number = string
> {
	control: Control<TField>
	name: FieldPath<TField>
	label: string
	options: SelectOption<TValue>[]
	placeholder?: string
	disabled?: boolean
}


export const FormMultiSelectField = <
	TField extends FieldValues,
	TValue extends string | number = string,
>({
	control,
	name,
	label,
	options,
	placeholder = "Selecione opções",
	disabled = false,
}: FormMultiSelectFieldProps<TField, TValue>) => {

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const values = (field.value ?? []) as TValue[]

				return (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel>
							{label}
						</FieldLabel>

						<Popover>
							<PopoverTrigger
								render={
									<Button
										variant="outline"
										role="combobox"
										disabled={disabled}
										className="w-full justify-between"
									/>
								}
							>
								{values.length > 0
									? `${values.length} selecionado(s)`
									: placeholder
								}

								<ChevronsUpDown
									className="ml-2 h-4 w-4 shrink-0 opacity-50"
								/>
							</PopoverTrigger>

							<PopoverContent className="w-full p-0">
								<Command>
									<CommandInput
										placeholder="Buscar..."
									/>

									<CommandList>
										<CommandEmpty>
											Nenhuma opção encontrada.
										</CommandEmpty>

										<CommandGroup>
											{options.map((option) => {
												const selected = values.includes(option.value as TValue)

												return (
													<CommandItem
														key={option.value}
														value={String(option.label)}
														onSelect={() => {

															const newValues =
																selected
																	? values.filter((value: TValue) => value !== (option.value as TValue))
																	: [
																		...values,
																		option.value,
																	]
															field.onChange(newValues)
														}}
													>
														<Check
															className={
																selected
																	? "mr-2 h-4 w-4 opacity-100"
																	: "mr-2 h-4 w-4 opacity-0"
															}
														/>
														{option.label}
													</CommandItem>
												)
											})}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>

						<FieldError errors={[fieldState.error]} />
					</Field>
				)
			}}
		/>
	)
}