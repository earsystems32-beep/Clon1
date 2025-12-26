import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface Settings {
  minAmount: number
  timerSeconds: number
  createUserEnabled: boolean
  alias: string
  phone: string
  paymentType: "alias" | "cbu"
  bonusPercentage: number
  bonusEnabled: boolean
  supportPhone: string
  autoRotationEnabled: boolean
  rotationIntervalMinutes: number
  currentLineIndex: number
  lastRotationTime: string
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function getSettings(): Promise<Settings> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single()

    if (error) {
      console.error("[Settings] Error fetching from Supabase:", error)
      throw new Error(`Failed to fetch settings: ${error.message}`)
    }

    if (!data) {
      throw new Error("Settings not found")
    }

    return {
      minAmount: data.min_amount,
      timerSeconds: data.timer_seconds,
      createUserEnabled: data.create_user_enabled,
      alias: data.alias,
      phone: data.phone,
      paymentType: data.payment_type,
      bonusPercentage: data.bonus_percentage ?? 25,
      bonusEnabled: data.bonus_enabled ?? true,
      supportPhone: data.support_phone ?? "+541141624225",
      autoRotationEnabled: data.auto_rotation_enabled ?? false,
      rotationIntervalMinutes: data.rotation_interval_minutes ?? 60,
      currentLineIndex: data.current_line_index ?? 0,
      lastRotationTime: data.last_rotation_time ?? new Date().toISOString(),
    }
  } catch (error) {
    console.error("[Settings] getSettings error:", error)
    throw error
  }
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  try {
    const supabase = getSupabaseClient()

    const dbUpdates: Record<string, unknown> = {}
    if (updates.minAmount !== undefined) dbUpdates.min_amount = updates.minAmount
    if (updates.timerSeconds !== undefined) dbUpdates.timer_seconds = updates.timerSeconds
    if (updates.createUserEnabled !== undefined) dbUpdates.create_user_enabled = updates.createUserEnabled
    if (updates.alias !== undefined) dbUpdates.alias = updates.alias
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.paymentType !== undefined) dbUpdates.payment_type = updates.paymentType
    if (updates.bonusPercentage !== undefined) dbUpdates.bonus_percentage = updates.bonusPercentage
    if (updates.bonusEnabled !== undefined) dbUpdates.bonus_enabled = updates.bonusEnabled
    if (updates.supportPhone !== undefined) dbUpdates.support_phone = updates.supportPhone
    if (updates.autoRotationEnabled !== undefined) dbUpdates.auto_rotation_enabled = updates.autoRotationEnabled
    if (updates.rotationIntervalMinutes !== undefined)
      dbUpdates.rotation_interval_minutes = updates.rotationIntervalMinutes
    if (updates.currentLineIndex !== undefined) dbUpdates.current_line_index = updates.currentLineIndex
    if (updates.lastRotationTime !== undefined) dbUpdates.last_rotation_time = updates.lastRotationTime

    const { data, error } = await supabase.from("settings").update(dbUpdates).eq("id", 1).select().single()

    if (error) {
      console.error("[Settings] Error updating Supabase:", error)
      throw new Error(`Failed to update settings: ${error.message}`)
    }

    if (!data) {
      throw new Error("Settings update returned no data")
    }

    return {
      minAmount: data.min_amount,
      timerSeconds: data.timer_seconds,
      createUserEnabled: data.create_user_enabled,
      alias: data.alias,
      phone: data.phone,
      paymentType: data.payment_type,
      bonusPercentage: data.bonus_percentage ?? 25,
      bonusEnabled: data.bonus_enabled ?? true,
      supportPhone: data.support_phone ?? "+541141624225",
      autoRotationEnabled: data.auto_rotation_enabled ?? false,
      rotationIntervalMinutes: data.rotation_interval_minutes ?? 60,
      currentLineIndex: data.current_line_index ?? 0,
      lastRotationTime: data.last_rotation_time ?? new Date().toISOString(),
    }
  } catch (error) {
    console.error("[Settings] updateSettings error:", error)
    throw error
  }
}
