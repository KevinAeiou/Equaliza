import { useAuth } from "@/src/features/auth/context/AuthProvider"
import { getDefaultValues, ProfileFormSchema, ProfileFormSchemaType } from "@/src/schemas/profile.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

interface UseProfileDialogProps {
	open: boolean
	onOpenChange: (value: boolean) => void
}

export const useProfileDialog = ({
	open,
	onOpenChange,
}: UseProfileDialogProps) => {
	const { user, updateProfile } = useAuth()

	const form = useForm<ProfileFormSchemaType>({
		resolver: zodResolver(ProfileFormSchema),
		defaultValues: getDefaultValues()
	})

	const resetForm = useCallback(() => {
		form.reset({
			first_name: user.first_name,
			last_name: user.last_name,
			avatar: user.avatar.id,
		})
	}, [form, user.avatar.id, user.first_name, user.last_name])

	const onSubmit = async (data: ProfileFormSchemaType) => {
		await updateProfile(data)

		toast.success("Perfil atualizado.")

		onOpenChange(false)
	}

	useEffect(() => {
		if (!open) {
			resetForm()
		}
	}, [open, user, form, resetForm])

	return {
		form,
		onSubmit,
	}
}