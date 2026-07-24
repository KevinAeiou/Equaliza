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

					<div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
						{AVATARS.map((avatar) => (
							<button
								key={avatar.id}
								type="button"
								onClick={() => field.onChange(avatar.id)}
								aria-label={avatar.name}
								className={cn(
									"rounded-full border-2 p-1 transition",
									field.value === avatar.id
										? "border-primary"
										: "border-transparent hover:border-muted-foreground"
								)}
							>
								<Avatar className="h-auto w-auto">
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