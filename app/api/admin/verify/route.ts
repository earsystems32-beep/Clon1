import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const adminPin = process.env.ADMIN_PIN
    
    if (!adminPin) {
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { pin } = body

    if (!pin || pin !== adminPin) {
      return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 })
    }

    return NextResponse.json({ success: true, message: "PIN correcto" })
  } catch (error) {
    console.error("[Admin Verify API] Error:", error)
    return NextResponse.json(
      { error: "Error al verificar el PIN" },
      { status: 500 }
    )
  }
}
