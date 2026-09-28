import {
	Field,
	FieldError,
	FieldLabel,
} from "@/src/components/ui/field"
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/src/components/ui/avatar"
import {
	Control,
	Controller,
	FieldPath,
	FieldValues,
} from "react-hook-form"
import { AVATARS } from "@/src/constants/avatars"
import { cn } from "@/src/lib/utils"


interface FormAvatarFieldProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
}


export const FormAvatarField = <T extends FieldValues,>({
	control,
	name,
	label,
}: FormAvatarFieldProps<T>) => {

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel>
						{label}
					</FieldLabel>

					<div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
						{AVATARS.map((avatar) => (
							<button
								key={avatar.id}
								type="button"
								onClick={() => field.onChange(avatar.id)}
								aria-label={avatar.name}
								aria-pressed={field.value === avatar.id}
								className={cn(
									"aspect-square rounded-full border-2 p-0.5 transition",
									field.value === avatar.id
										? "border-brand ring-2 ring-brand/25"
										: "border-transparent hover:border-muted-foreground/50"
								)}
							>
								<Avatar className="size-full">
									<AvatarImage
										src={avatar.image}
										alt={avatar.name}
									/>

									<AvatarFallback>
										{avatar.name[0]}
									</AvatarFallback>
								</Avatar>
							</button>
						))}
					</div>

					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	)
}