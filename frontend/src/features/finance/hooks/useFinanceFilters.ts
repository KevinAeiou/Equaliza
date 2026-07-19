import { addDays } from "date-fns"
import { useState } from "react"
import { DateRange } from "react-day-picker"


export const useFinanceFilters = () => {
	const [date, setDate] = useState<DateRange | undefined>({
		from: new Date(new Date().getFullYear(), 0, 20),
		to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
	})
	
	return {
		date, setDate,
	}
}