import { NextResponse } from "next/server"
import { getSettings, updateSettings } from "@/lib/settings"

export async function GET() {
  try {
    const settings = await getSettings()

    // Check if auto rotation is enabled
    if (!settings.autoRotationEnabled) {
      return NextResponse.json({
        success: true,
        rotationEnabled: false,
        currentLineIndex: settings.currentLineIndex,
      })
    }

    // Calculate if rotation is needed
    const lastRotation = new Date(settings.lastRotationTime)
    const now = new Date()
    const minutesSinceLastRotation = (now.getTime() - lastRotation.getTime()) / (1000 * 60)

    if (minutesSinceLastRotation >= settings.rotationIntervalMinutes) {
      // Rotate to next line (0-6, total of 7 lines)
      const nextLineIndex = (settings.currentLineIndex + 1) % 7

      // Update settings with new line index
      await updateSettings({
        currentLineIndex: nextLineIndex,
        lastRotationTime: now.toISOString(),
      })

      return NextResponse.json({
        success: true,
        rotationEnabled: true,
        currentLineIndex: nextLineIndex,
        rotated: true,
        message: `Rotación automática a Línea ${nextLineIndex + 1}`,
      })
    }

    return NextResponse.json({
      success: true,
      rotationEnabled: true,
      currentLineIndex: settings.currentLineIndex,
      rotated: false,
      minutesUntilNextRotation: settings.rotationIntervalMinutes - minutesSinceLastRotation,
    })
  } catch (error) {
    console.error("[Rotation API] GET error:", error)
    return NextResponse.json(
      {
        error: "Error al verificar rotación",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
