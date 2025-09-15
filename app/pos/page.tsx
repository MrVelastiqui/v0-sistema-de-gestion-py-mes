import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { POSInterface } from "@/components/pos-interface"
import { Navigation } from "@/components/navigation"

export default async function POSPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch products for the POS interface
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <POSInterface products={products || []} />
    </div>
  )
}
