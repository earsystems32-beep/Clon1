import { NextResponse } from "next/server"
import { getSettings, updateSettings } from "@/lib/settings"

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("[Admin Settings API] GET error:", error)
    return NextResponse.json({ error: "Error al obtener la configuración" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminPin = process.env.ADMIN_PIN
    if (!adminPin) {
      return NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 })
    }

    const body = await request.json()
    const {
      pin,
      minAmount,
      timerSeconds,
      createUserEnabled,
      alias,
      phone,
      paymentType,
      bonusPercentage,
      bonusEnabled,
      supportPhone,
    } = body

    if (!pin || pin !== adminPin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const updates: Record<string, unknown> = {}

    if (minAmount !== undefined) {
      if (typeof minAmount !== "number" || minAmount < 0) {
        return NextResponse.json({ error: "El monto mínimo debe ser un número mayor o igual a 0" }, { status: 400 })
      }
      updates.minAmount = minAmount
    }

    if (timerSeconds !== undefined) {
      if (typeof timerSeconds !== "number" || timerSeconds < 0 || timerSeconds > 300) {
        return NextResponse.json({ error: "El temporizador debe estar entre 0 y 300 segundos" }, { status: 400 })
      }
      updates.timerSeconds = timerSeconds
    }

    if (createUserEnabled !== undefined) {
      if (typeof createUserEnabled !== "boolean") {
        return NextResponse.json(
          { error: "El estado de creación de usuarios debe ser verdadero o falso" },
          { status: 400 },
        )
      }
      updates.createUserEnabled = createUserEnabled
    }

    if (alias !== undefined) {
      if (typeof alias !== "string" || alias.trim().length === 0) {
        return NextResponse.json({ error: "El alias no puede estar vacío" }, { status: 400 })
      }
      updates.alias = alias.trim()
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim().length < 8) {
        return NextResponse.json({ error: "El teléfono debe tener al menos 8 dígitos" }, { status: 400 })
      }
      updates.phone = phone.trim()
    }

    if (paymentType !== undefined) {
      if (paymentType !== "alias" && paymentType !== "cbu") {
        return NextResponse.json({ error: "El tipo de pago debe ser 'alias' o 'cbu'" }, { status: 400 })
      }
      updates.paymentType = paymentType
    }

    if (bonusPercentage !== undefined) {
      if (typeof bonusPercentage !== "number" || bonusPercentage < 0 || bonusPercentage > 100) {
        return NextResponse.json({ error: "El porcentaje de bono debe estar entre 0 y 100" }, { status: 400 })
      }
      updates.bonusPercentage = bonusPercentage
    }

    if (bonusEnabled !== undefined) {
      if (typeof bonusEnabled !== "boolean") {
        return NextResponse.json({ error: "El estado del bono debe ser verdadero o falso" }, { status: 400 })
      }
      updates.bonusEnabled = bonusEnabled
    }

    if (supportPhone !== undefined) {
      if (typeof supportPhone !== "string" || supportPhone.trim().length < 8) {
        return NextResponse.json({ error: "El teléfono de soporte debe tener al menos 8 dígitos" }, { status: 400 })
      }
      updates.supportPhone = supportPhone.trim()
    }

    const updatedSettings = await updateSettings(updates)

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: "Configuración actualizada correctamente",
    })
  } catch (error) {
    console.error("[Admin Settings API] POST error:", error)
    return NextResponse.json(
      {
        error: "Error al guardar la configuración",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
