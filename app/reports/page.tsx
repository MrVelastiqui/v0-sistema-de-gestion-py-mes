import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { FinancialReports } from "@/components/financial-reports"

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch sales data with items
  const { data: sales } = await supabase
    .from("sales")
    .select(`
      *,
      sale_items (
        *,
        products (
          name,
          category,
          price
        )
      )
    `)
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Fetch expenses data
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", data.user.id)
    .order("date", { ascending: false })

  // Fetch inventory for cost calculations
  const { data: inventory } = await supabase
    .from("inventory")
    .select(`
      *,
      products (
        id,
        name,
        category,
        price
      )
    `)
    .eq("user_id", data.user.id)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-6">
        <FinancialReports sales={sales || []} expenses={expenses || []} inventory={inventory || []} />
      </div>
    </div>
  )
}
