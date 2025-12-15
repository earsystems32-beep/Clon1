"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Lock, LogOut, Save, Sparkles, AlertCircle, Clock, DollarSign, Users, Gift } from "lucide-react"

const SUPPORT_CONTACTS = [
  { name: "Linea 1", phone: "541176067205" },
  { name: "Linea 2", phone: "541127214473" },
  { name: "Linea 3", phone: "541166848706" },
  { name: "Linea 4", phone: "541141624225" },
  { name: "Linea 5", phone: "541171132238" },
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
  const [isLoading, setIsLoading] = useState(false)
  const [alias, setAlias] = useState("")
  const [paymentType, setPaymentType] = useState<"alias" | "cbu">("alias")
  const [cbuError, setCbuError] = useState("")
  const [selectedContactIndex, setSelectedContactIndex] = useState<string>("0")
  const [supportPhone, setSupportPhone] = useState("")
  const [isPhoneEditable, setIsPhoneEditable] = useState(false)
  const [activeAlias, setActiveAlias] = useState("")
  const [activePhone, setActivePhone] = useState("")
  const [activeContactName, setActiveContactName] = useState("")
  const [activePaymentType, setActivePaymentType] = useState<"alias" | "cbu">("alias")
  const [userCreationEnabled, setUserCreationEnabled] = useState(true)
  const [transferTimer, setTransferTimer] = useState("30")
  const [minAmount, setMinAmount] = useState("2000")
  const [bonusPercentage, setBonusPercentage] = useState("25")
  const [bonusEnabled, setBonusEnabled] = useState(true)
  const [activeUserCreationEnabled, setActiveUserCreationEnabled] = useState(true)
  const [activeTransferTimer, setActiveTransferTimer] = useState(30)
  const [activeMinAmount, setActiveMinAmount] = useState(2000)
  const [activeBonusPercentage, setActiveBonusPercentage] = useState(25)
  const [activeBonusEnabled, setActiveBonusEnabled] = useState(true)
  const [adminPin, setAdminPin] = useState("") // Store PIN for config saves
  const [supportPhoneNumber, setSupportPhoneNumber] = useState("+541141624225")
  const [activeSupportPhone, setActiveSupportPhone] = useState("+541141624225")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/admin/settings?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          const settings = data.settings
          setActiveAlias(settings.alias || "")
          setAlias(settings.alias || "")
          setActivePhone(settings.phone || "")
          setActivePaymentType(settings.paymentType || "alias")
          setPaymentType(settings.paymentType || "alias")
          setUserCreationEnabled(settings.createUserEnabled ?? true)
          setTransferTimer(String(settings.timerSeconds ?? 30))
          setMinAmount(String(settings.minAmount ?? 2000))
          setBonusPercentage(String(settings.bonusPercentage ?? 25))
          setBonusEnabled(settings.bonusEnabled ?? true)

          setSupportPhoneNumber(settings.supportPhone || "+541141624225")
          setActiveSupportPhone(settings.supportPhone || "+541141624225")

          if (settings.phone) {
            const idx = SUPPORT_CONTACTS.findIndex((c) => c.phone === settings.phone)
            if (idx >= 0) {
              setSelectedContactIndex(String(idx))
              setSupportPhone(SUPPORT_CONTACTS[idx].phone)
              setIsPhoneEditable(SUPPORT_CONTACTS[idx].name === "Otro / Personalizado")
              setActiveContactName(SUPPORT_CONTACTS[idx].name)
            } else {
              setSelectedContactIndex(String(SUPPORT_CONTACTS.length - 1))
              setSupportPhone(settings.phone)
              setIsPhoneEditable(true)
              setActiveContactName("Otro / Personalizado")
            }
          } else {
            setSelectedContactIndex("0")
            setSupportPhone(SUPPORT_CONTACTS[0]?.phone || "")
            setIsPhoneEditable(false)
            setActiveContactName(SUPPORT_CONTACTS[0]?.name || "")
          }
        }
      }
    } catch (error) {
      console.error("Error loading config:", error)
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

  const handleLogin = async () => {
    if (!pinInput.trim()) {
      alert("Ingresá el PIN de administrador")
      return
    }

    setIsLoading(true)
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
          await loadConfig()
          setPinInput("")
        } else {
          alert("PIN incorrecto")
          setPinInput("")
        }
      } else {
        const data = await response.json()
        alert(data.error || "PIN incorrecto o error de conexión")
        setPinInput("")
      }
    } catch (error) {
      alert("Error de conexión. Intentá de nuevo.")
      console.error("Login error:", error)
      setPinInput("")
    } finally {
      setIsLoading(false)
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

  const saveConfig = async () => {
    if (isSaving) return

    setIsSaving(true)

    try {
      const phoneValue = sanitizePhone(supportPhone.trim())

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: adminPin,
          minAmount: Number(minAmount),
          timerSeconds: Number(transferTimer),
          createUserEnabled: userCreationEnabled,
          alias: alias.trim(),
          phone: phoneValue,
          paymentType,
          bonusPercentage: Number(bonusPercentage),
          bonusEnabled,
          supportPhone: sanitizePhone(supportPhoneNumber.trim()),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setActiveAlias(alias.trim())
          setActivePhone(phoneValue)
          setActivePaymentType(paymentType)
          setActiveUserCreationEnabled(userCreationEnabled)
          setActiveTransferTimer(Number(transferTimer))
          setActiveMinAmount(Number(minAmount))
          setActiveBonusPercentage(Number(bonusPercentage))
          setActiveBonusEnabled(bonusEnabled)
          setActiveSupportPhone(sanitizePhone(supportPhoneNumber.trim()))
          alert("✓ Configuración guardada correctamente")
        } else {
          alert(`Error: ${data.error || "No se pudo guardar la configuración"}`)
        }
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || "No se pudo guardar la configuración"}`)
      }
    } catch (error) {
      console.error("Error saving config:", error)
      alert("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
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
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                  placeholder="Ingresá el PIN"
                  disabled={isLoading}
                  className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="max-w-[320px] w-full h-12 bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-500 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-600 text-black font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? "Verificando..." : "Entrar"}
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
                      checked={userCreationEnabled}
                      onCheckedChange={setUserCreationEnabled}
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
                      value={transferTimer}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        setTransferTimer(value)
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
                          setMinAmount(value)
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
                            setBonusPercentage(value)
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

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    id="btn-save-cfg"
                    onClick={saveConfig}
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
                    {activeUserCreationEnabled ? "Activado" : "Desactivado"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Temporizador:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">{activeTransferTimer}s</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Monto mínimo:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">${activeMinAmount}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Bono activado:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {activeBonusEnabled ? "Sí" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Porcentaje de bono:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">{activeBonusPercentage}%</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Línea atención:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {activeContactName || "Sin configurar"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Tel. atención:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {activePhone || "Sin configurar"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-purple-500/10">
                  <Label className="text-xs text-cyan-200/70 font-medium min-w-[120px]">Tel. soporte:</Label>
                  <span className="text-sm text-white font-mono truncate max-w-[200px]">
                    {activeSupportPhone || "Sin configurar"}
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
