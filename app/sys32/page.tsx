"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Lock, LogOut, Save, Sparkles, AlertCircle, Clock, DollarSign, Users, Gift, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const SUPPORT_CONTACTS = [
  { name: "Linea 1", phone: "541176067205" },
  { name: "Linea 2", phone: "541127214473" },
  { name: "Linea 3", phone: "541166848706" },
  { name: "Linea 4", phone: "541176067761" },
  { name: "Linea 5", phone: "541127419425" },
  { name: "Linea 6", phone: "541171002343" },
  { name: "Linea 7", phone: "541166891411" },
  { name: "Otro / Personalizado", phone: "" },
]

const sanitizeAlias = (value: string): string => {
  // Allow letters, numbers, dots, and hyphens only
  return value.replace(/[^A-Za-z0-9.-]/g, "").slice(0, 50)
}

const sanitizeCBU = (value: string): string => {
  // Only allow digits, max 22
  return value.replace(/\D/g, "").slice(0, 22)
}

const sanitizePhone = (value: string): string => {
  // Only allow digits, between 8-15 characters
  return value.replace(/\D/g, "").slice(0, 15)
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [alias, setAlias] = useState("")
  const [paymentType, setPaymentType] = useState<"alias" | "cbu">("alias")
  const [cbuError, setCbuError] = useState("")
  const [selectedContactIndex, setSelectedContactIndex] = useState<string>("0")
  const [supportPhone, setSupportPhone] = useState("")
  const [isPhoneEditable, setIsPhoneEditable] = useState(false)
  const [minAmount, setMinAmount] = useState(2000)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [createUserEnabled, setCreateUserEnabled] = useState(true)
  const [adminPin, setAdminPin] = useState("") // Store PIN for config saves
  const [supportPhoneNumber, setSupportPhoneNumber] = useState("+541141624225")
  const [saving, setSaving] = useState(false)
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(false)
  const [rotationIntervalMinutes, setRotationIntervalMinutes] = useState(60)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [bonusPercentage, setBonusPercentage] = useState(25) // Declare bonusPercentage
  const [bonusEnabled, setBonusEnabled] = useState(true) // Declare bonusEnabled

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const resp = await fetch("/api/admin/settings")
      const json = await resp.json()
      if (json.success && json.settings) {
        const s = json.settings
        setMinAmount(s.minAmount)
        setTimerSeconds(s.timerSeconds)
        setCreateUserEnabled(s.createUserEnabled)
        setAlias(s.alias)
        setPaymentType(s.paymentType)
        setBonusPercentage(s.bonusPercentage ?? 25)
        setBonusEnabled(s.bonusEnabled ?? true)
        setSupportPhoneNumber(s.supportPhone ?? "+541141624225")
        setAutoRotationEnabled(s.autoRotationEnabled ?? false)
        setRotationIntervalMinutes(s.rotationIntervalMinutes ?? 60)
        setCurrentLineIndex(s.currentLineIndex ?? 0)

        const phone = s.phone || ""
        setSupportPhone(phone)

        const idx = SUPPORT_CONTACTS.findIndex((c) => c.phone === phone)
        if (idx >= 0) {
          setSelectedContactIndex(String(idx))
          setIsPhoneEditable(idx === SUPPORT_CONTACTS.length - 1)
        } else {
          setSelectedContactIndex(String(SUPPORT_CONTACTS.length - 1))
          setIsPhoneEditable(true)
        }
      } else {
        toast({ title: "Error", description: json.error || "No se pudo cargar la configuración" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al conectar con el servidor" })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!pinInput.trim()) {
      toast({ title: "Error", description: "Ingresá el PIN de administrador" })
      return
    }

    setLoading(true)
    try {
      const testPIN = pinInput.trim()

      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: testPIN }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsAuthenticated(true)
          setAdminPin(testPIN)
          await loadSettings()
          setPinInput("")
        } else {
          toast({ title: "Error", description: "PIN incorrecto" })
          setPinInput("")
        }
      } else {
        const data = await response.json()
        toast({ title: "Error", description: data.error || "PIN incorrecto o error de conexión" })
        setPinInput("")
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión. Intentá de nuevo." })
      console.error("Login error:", error)
      setPinInput("")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsAuthenticated(false)
    setPinInput("")
    setAdminPin("")
  }

  const validateCbu = (value: string): boolean => {
    if (paymentType === "cbu") {
      if (value.length === 0) {
        setCbuError("")
        return false
      }
      if (value.length < 22) {
        setCbuError(`Faltan ${22 - value.length} dígitos`)
        return false
      }
      if (value.length === 22) {
        setCbuError("")
        return true
      }
    }
    setCbuError("")
    return true
  }

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    if (paymentType === "cbu") {
      value = sanitizeCBU(value)
    } else {
      value = sanitizeAlias(value)
    }

    setAlias(value)
    validateCbu(value)
  }

  const handleSave = async () => {
    if (!adminPin) {
      toast({ title: "Error", description: "Ingresá el PIN de administrador" })
      return
    }

    setSaving(true)
    try {
      const resp = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: adminPin,
          minAmount,
          timerSeconds,
          createUserEnabled,
          alias,
          phone: supportPhone,
          paymentType,
          bonusPercentage,
          bonusEnabled,
          supportPhone: supportPhoneNumber,
          autoRotationEnabled,
          rotationIntervalMinutes,
          currentLineIndex,
        }),
      })

      const json = await resp.json()
      if (json.success) {
        toast({ title: "Configuración guardada", description: json.message || "Cambios aplicados correctamente" })
        await loadSettings()
      } else {
        toast({ title: "Error", description: json.error || "No se pudo guardar" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al conectar con el servidor" })
    } finally {
      setSaving(false)
    }
  }

  const handleContactChange = (value: string) => {
    setSelectedContactIndex(value)
    const idx = Number(value)
    const contact = SUPPORT_CONTACTS[idx]

    if (contact) {
      setSupportPhone(contact.phone)
      setIsPhoneEditable(contact.name === "Otro / Personalizado")
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-slate-900 to-black">
      <div className="fixed top-20 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {!isAuthenticated ? (
          <Card className="border border-purple-500/30 shadow-2xl backdrop-blur-md bg-gradient-to-br from-purple-950/90 to-purple-900/85">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-cyan-400" />
                <CardTitle className="text-3xl bg-gradient-to-r from-cyan-300 via-sky-400 to-cyan-300 bg-clip-text text-transparent font-semibold">
                  Acceso Administrador
                </CardTitle>
              </div>
              <CardDescription className="text-purple-200/80">
                Ingresá el PIN para acceder al panel de configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <div className="space-y-2">
                <Label htmlFor="admin-pin" className="text-base text-purple-100/90 font-semibold">
                  PIN de administrador
                </Label>
                <Input
                  id="admin-pin"
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
                  placeholder="Ingresá el PIN"
                  disabled={loading}
                  className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="max-w-[320px] w-full h-12 bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-500 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-600 text-black font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Verificando..." : "Entrar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border border-purple-500/30 shadow-2xl backdrop-blur-md bg-gradient-to-br from-purple-950/90 to-purple-900/85">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                  <CardTitle className="text-3xl bg-gradient-to-r from-cyan-300 via-sky-400 to-cyan-300 bg-clip-text text-transparent font-semibold">
                    Configuración
                  </CardTitle>
                </div>
                <CardDescription className="text-purple-200/80">Modificá los parámetros del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <div className="space-y-3 p-4 rounded-lg bg-purple-900/30 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-cyan-300">Control de acceso</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-creation-toggle" className="text-base text-purple-100/90 font-medium">
                      Permitir creación de usuarios
                    </Label>
                    <Switch
                      id="user-creation-toggle"
                      checked={createUserEnabled}
                      onCheckedChange={setCreateUserEnabled}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>
                  <p className="text-xs text-purple-300/70">
                    Cuando está desactivado, los usuarios no podrán crear nuevas cuentas
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-purple-900/30 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-cyan-300">Temporizador</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-timer" className="text-base text-purple-100/90 font-medium">
                      Tiempo de espera (segundos)
                    </Label>
                    <Input
                      id="transfer-timer"
                      type="text"
                      inputMode="numeric"
                      value={timerSeconds}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        setTimerSeconds(Number(value))
                      }}
                      placeholder="30"
                      className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                    />
                    <p className="text-xs text-purple-300/70">
                      Tiempo de espera en la sección "Esperando transferencia" (0-300 segundos)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-purple-900/30 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-cyan-300">Monto mínimo</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-amount" className="text-base text-purple-100/90 font-medium">
                      Monto mínimo de transferencia (ARS)
                    </Label>
                    <Input
                      id="min-amount"
                      type="text"
                      inputMode="numeric"
                      value={minAmount}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value)) {
                          setMinAmount(Number(value))
                        }
                      }}
                      placeholder="2000"
                      className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white"
                    />
                    <p className="text-xs text-purple-300/70">
                      Transferencias por debajo de este monto serán rechazadas
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-purple-900/30 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-cyan-300">Bono de bienvenida</h3>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="bonus-toggle" className="text-base text-purple-100/90 font-medium">
                      Activar bono de primera carga
                    </Label>
                    <Switch
                      id="bonus-toggle"
                      checked={bonusEnabled}
                      onCheckedChange={setBonusEnabled}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonus-percentage" className="text-base text-purple-100/90 font-medium">
                      Porcentaje de bono (%)
                    </Label>
                    <Input
                      id="bonus-percentage"
                      type="text"
                      inputMode="numeric"
                      value={bonusPercentage}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value)) {
                          const num = Number(value)
                          if (value === "" || (num >= 0 && num <= 100)) {
                            setBonusPercentage(num)
                          }
                        }
                      }}
                      placeholder="25"
                      disabled={!bonusEnabled}
                      className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-purple-300/70">
                      Porcentaje adicional que se mostrará en el modal de felicitaciones (0-100%)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base text-purple-100/90 font-semibold">Tipo de pago</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="payment-type"
                          value="alias"
                          checked={paymentType === "alias"}
                          onChange={(e) => {
                            setPaymentType(e.target.value as "alias" | "cbu")
                            setCbuError("")
                            setAlias("")
                          }}
                          className="w-4 h-4 text-cyan-400 border-purple-500/30 focus:ring-cyan-400/50"
                        />
                        <span className="text-purple-100/90">Alias</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="payment-type"
                          value="cbu"
                          checked={paymentType === "cbu"}
                          onChange={(e) => {
                            setPaymentType(e.target.value as "alias" | "cbu")
                            setCbuError("")
                            setAlias("")
                          }}
                          className="w-4 h-4 text-cyan-400 border-purple-500/30 focus:ring-cyan-400/50"
                        />
                        <span className="text-purple-100/90">CBU</span>
                      </label>
                    </div>
                    {paymentType === "cbu" && (
                      <span
                        className={`text-sm font-medium ${
                          alias.length === 22
                            ? "text-green-400"
                            : alias.length > 0
                              ? "text-cyan-400"
                              : "text-purple-300/50"
                        }`}
                      >
                        {alias.length}/22
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    id="cfg-alias"
                    type="text"
                    inputMode={paymentType === "cbu" ? "numeric" : "text"}
                    value={alias}
                    onChange={handleAliasChange}
                    placeholder={paymentType === "alias" ? "Ejemplo: DLHogar.mp" : "Ejemplo: 0000003100010000000000"}
                    className={`h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50 ${
                      cbuError ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50" : ""
                    }`}
                  />
                  {cbuError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cbuError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 bg-purple-950/30 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-cyan-300">Líneas de Atención</h3>
                  <p className="text-sm text-purple-200/70">Números para transferencias y cargas</p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cfg-support-select" className="text-base text-purple-100/90 font-semibold">
                        Seleccionar línea
                      </Label>
                      <Select value={selectedContactIndex} onValueChange={handleContactChange}>
                        <SelectTrigger
                          id="cfg-support-select"
                          className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white"
                        >
                          <SelectValue placeholder="Seleccioná un contacto…" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORT_CONTACTS.map((contact, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cfg-phone-display" className="text-base text-purple-100/90 font-semibold">
                        Teléfono seleccionado
                      </Label>
                      <Input
                        id="cfg-phone-display"
                        type="text"
                        inputMode="numeric"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(sanitizePhone(e.target.value))}
                        readOnly={!isPhoneEditable}
                        placeholder="Número de teléfono"
                        className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-purple-950/30 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-cyan-300">Teléfono de Soporte</h3>
                  <p className="text-sm text-purple-200/70">Número para ayuda y asistencia técnica</p>

                  <div className="space-y-2">
                    <Label htmlFor="cfg-support-phone" className="text-base text-purple-100/90 font-semibold">
                      WhatsApp de soporte
                    </Label>
                    <Input
                      id="cfg-support-phone"
                      type="text"
                      inputMode="numeric"
                      value={supportPhoneNumber}
                      onChange={(e) => setSupportPhoneNumber(sanitizePhone(e.target.value))}
                      placeholder="+541141624225"
                      className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                    />
                    <p className="text-xs text-purple-300/60">
                      Este número aparecerá en el botón de contacto con soporte
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/60 border-cyan-500/20 shadow-xl shadow-cyan-500/10">
                  <CardHeader className="border-b border-cyan-500/20 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-cyan-300">Rotación Automática de Líneas</CardTitle>
                        <p className="text-sm text-purple-200/70 mt-1">
                          Sistema de cambio automático entre las 7 líneas disponibles
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-purple-950/50 rounded-lg border border-purple-500/30">
                      <div className="space-y-1">
                        <Label htmlFor="auto-rotation-toggle" className="text-base font-semibold text-purple-100/90">
                          Activar rotación automática
                        </Label>
                        <p className="text-sm text-purple-200/60">
                          Las líneas cambiarán automáticamente según el intervalo configurado
                        </p>
                      </div>
                      <Switch
                        id="auto-rotation-toggle"
                        checked={autoRotationEnabled}
                        onCheckedChange={setAutoRotationEnabled}
                      />
                    </div>

                    {autoRotationEnabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="rotation-interval" className="text-base text-purple-100/90 font-semibold">
                            Intervalo de rotación (minutos)
                          </Label>
                          <Input
                            id="rotation-interval"
                            type="number"
                            min="1"
                            max="1440"
                            value={rotationIntervalMinutes}
                            onChange={(e) => setRotationIntervalMinutes(Number(e.target.value))}
                            className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white"
                          />
                          <p className="text-sm text-purple-200/60">
                            Cada {rotationIntervalMinutes} minutos se cambiará a la siguiente línea
                          </p>
                        </div>

                        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-cyan-300">Línea actual activa</p>
                              <p className="text-2xl font-bold text-cyan-400 mt-1">
                                {SUPPORT_CONTACTS[currentLineIndex]?.name || "Línea 1"}
                              </p>
                              <p className="text-sm text-purple-200/60 mt-1">
                                {SUPPORT_CONTACTS[currentLineIndex]?.phone || ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-purple-200/60">Índice</p>
                              <p className="text-3xl font-bold text-cyan-400">{currentLineIndex + 1}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              const nextIndex = (currentLineIndex + 1) % 7
                              setCurrentLineIndex(nextIndex)
                              toast({
                                title: "Línea cambiada manualmente",
                                description: `Ahora usando ${SUPPORT_CONTACTS[nextIndex]?.name}`,
                              })
                            }}
                            variant="outline"
                            className="flex-1 bg-purple-950/50 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-300"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Rotar manualmente
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    id="btn-save-cfg"
                    onClick={handleSave}
                    disabled={paymentType === "cbu" && alias.length !== 22}
                    className="flex-1 h-12 bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-500 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-600 text-black font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar cambios
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="flex-1 h-12 border-purple-500/30 hover:bg-purple-900/30 hover:border-cyan-400 transition-all duration-200 text-purple-200 bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/60 to-purple-900/40 border-purple-500/20 backdrop-blur-sm shadow-xl shadow-cyan-500/10">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-cyan-300">Estado Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Crear usuarios:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {createUserEnabled ? "Activado" : "Desactivado"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Temporizador:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">{timerSeconds}s</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Monto mínimo:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">${minAmount}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Bono activado:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {bonusEnabled ? "Sí" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Porcentaje de bono:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">{bonusPercentage}%</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Línea atención:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {SUPPORT_CONTACTS.find((_, idx) => idx === Number(selectedContactIndex))?.name || "Sin configurar"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Tel. atención:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {supportPhone || "Sin configurar"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Tel. soporte:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {supportPhoneNumber || "Sin configurar"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Rotación automática:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {autoRotationEnabled ? "Activada" : "Desactivada"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Intervalo de rotación:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {rotationIntervalMinutes} minutos
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Línea actual:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {SUPPORT_CONTACTS[currentLineIndex]?.name || "Sin configurar"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
