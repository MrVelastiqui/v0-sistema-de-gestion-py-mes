import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { InventoryManager } from "@/components/inventory-manager"

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch inventory data with product information
  const { data: inventory } = await supabase
    .from("inventory")
    .select(`
      *,
      products (
        id,
        name,
        category,
        price,
        description
      )
    `)
    .eq("user_id", data.user.id)
    .order("last_updated", { ascending: false })

  // Fetch products that don't have inventory records yet
  const { data: allProducts } = await supabase.from("products").select("*").eq("is_active", true)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-6">
        <InventoryManager initialInventory={inventory || []} allProducts={allProducts || []} />
      </div>
    </div>
  )
}
