import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import { Field } from "@/src/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useFinanceFilters } from "../hooks/useFinanceFilters"

export const FinanceFilters = () => {
	const {
		date, setDate,
	} = useFinanceFilters()

	return (
		<div className="flex gap-3">
			<Select >
				<SelectTrigger className="w-52">
					<SelectValue />
				</SelectTrigger>

				<SelectContent>
					<SelectItem value="day">Dia</SelectItem>
					<SelectItem value="week">Semana</SelectItem>
					<SelectItem value="month">Mês</SelectItem>
					<SelectItem value="year">Ano</SelectItem>
					<SelectItem value="period">Ano</SelectItem>
					<Field className="mx-auto w-60">
						<Popover>
							<PopoverTrigger render={
								<Button
									variant="outline"
									id="date-picker-range"
									className="justify-start px-2.5 font-normal"
								>
									<CalendarIcon data-icon="inline-start" />
									{date?.from ? (
										date.to ? (
											<>
												{format(date.from, "LLL dd, y")} -{" "}
												{format(date.to, "LLL dd, y")}
											</>
										) : (
											format(date.from, "LLL dd, y")
										)
									) : (
										<span>Selecione o período</span>
									)}
								</Button>
							} />

							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="range"
									defaultMonth={date?.from}
									selected={date}
									onSelect={setDate}
									numberOfMonths={2}
								/>
							</PopoverContent>
						</Popover>
					</Field>
				</SelectContent>
			</Select>
		</div>
	)
}