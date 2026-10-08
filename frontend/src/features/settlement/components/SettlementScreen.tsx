"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { HeaderScreen } from "@/src/components/headerScreen"
import { useAuth } from "@/src/components/providers/AuthProvider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { UserRole } from "@/src/types"
import { useSettlementBalance } from "../hooks/useSettlementBalance"
import { currentMonth, isValidMonth } from "../utils"
import { MembersTable } from "./MembersTable"
import { MonthNavigator } from "./MonthNavigator"
import { PaymentDialog } from "./PaymentDialog"
import { SettlementHistory } from "./SettlementHistory"
import { SettlementSummary } from "./SettlementSummary"

export const SettlementScreen = () => {
	const router = useRouter()
	const params = useSearchParams()
	const { user } = useAuth()

	const queryMonth = params.get("month")
	const month = isValidMonth(queryMonth) ? queryMonth : currentMonth()

	const [refresh, setRefresh] = useState(0)
	const [payTo, setPayTo] = useState<number | undefined>(() => {
		const pay = Number(params.get("pay"))

		return pay > 0 ? pay : undefined
	})
	const [open, setOpen] = useState(() => Number(params.get("pay")) > 0)

	const { balance, loading, error } = useSettlementBalance(month, refresh)

	const canCancel = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN

	const changeMonth = (value: string) => router.replace(`/settlement?month=${value}`)

	const openPayment = (receiver?: number) => {
		setPayTo(receiver)
		setOpen(true)
	}

	const reload = () => setRefresh((value) => value + 1)

	return (
		<section className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<HeaderScreen
					title="Acertos"
					subtitle="Veja quem deve a quem e registre os pagamentos entre os membros."
				/>

				<MonthNavigator month={month} start={balance?.settlement_start} onChange={changeMonth} />
			</div>

			{error && <p className="text-sm text-destructive">Não foi possível carregar o saldo.</p>}
			{loading && <div className="h-40 animate-pulse rounded-xl bg-muted" />}

			{balance && (
				<Tabs defaultValue="balance" className="gap-4 sm:gap-6">
					<TabsList>
						<TabsTrigger value="balance">Saldo</TabsTrigger>
						<TabsTrigger value="history">Histórico</TabsTrigger>
					</TabsList>

					<TabsContent value="balance" className="flex flex-col gap-4 sm:gap-6">
						<SettlementSummary balance={balance} userId={user.id} onPay={openPayment} />
						<MembersTable members={balance.members} />
					</TabsContent>

					<TabsContent value="history">
						<SettlementHistory
							month={month}
							members={balance.members}
							canCancel={canCancel}
							refresh={refresh}
							onChanged={reload}
						/>
					</TabsContent>
				</Tabs>
			)}

			{open && balance && (
				<PaymentDialog
					userId={user.id}
					month={month}
					balance={balance}
					initialReceiver={payTo}
					onClose={() => setOpen(false)}
					onSuccess={reload}
				/>
			)}
		</section>
	)
}
