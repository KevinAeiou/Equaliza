import { api } from "@/src/infra/api"
import { configureError } from "@/src/lib/utils"

export const FamilyAPI = () => ({
    changeCurrentFamily: async (familyId: number) => {
        try {
            await api({
                url: `families/current/`,
                method: "PATCH",
                data: {
                    family_id: familyId,
                },
            })
        } catch (error: unknown) {
            throw configureError(error, "alterar família atual")
        }
	},
	
	createFamily: async (name: string) => {
        try {
            const response = await api({
                url: `families/`,
                method: "POST",
                data: {
                    name,
                },
            })

            return response.data
        } catch (error: unknown) {
            throw configureError(error, "criar família")
        }
    },
})