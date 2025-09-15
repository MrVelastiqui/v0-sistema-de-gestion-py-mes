import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    "https://zwimlpzcmnsyunttvqxu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aW1scHpjbW5zeXVudHR2cXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjIxNzYsImV4cCI6MjA3MzUzODE3Nn0.mYJ0O8oZSk3AzwY5sDtZJuqX0ea4l8VWPnxNsP_WZGg",
  )
}
