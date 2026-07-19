import { env } from "@/src/lib/env"
import axios from "axios"
import qs from "qs"

export const api = axios.create({
	baseURL: env.api_url + `/api`,
	withCredentials: true,
	paramsSerializer: {
		serialize: (params) =>
			qs.stringify(params, {
				arrayFormat: "repeat",
			}),
	},
})
