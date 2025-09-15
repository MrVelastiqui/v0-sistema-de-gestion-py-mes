import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { ExpenseTracker } from "@/components/expense-tracker"

export default async function ExpensesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch expenses for the current user
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", data.user.id)
    .order("date", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-6">
        <ExpenseTracker initialExpenses={expenses || []} />
      </div>
    </div>
  )
}
