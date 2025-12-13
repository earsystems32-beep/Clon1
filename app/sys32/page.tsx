"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Lock, LogOut, Save, Sparkles, Phone, CheckCircle2, AlertCircle, Clock, DollarSign, Users } from "lucide-react"

const SUPPORT_CONTACTS = [
  { name: "Linea 1", phone: "541176067205" },
  { name: "Linea 2", phone: "541127214473" },
  { name: "Linea 3", phone: "541166848706" },
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
  const [activeUserCreationEnabled, setActiveUserCreationEnabled] = useState(true)
  const [activeTransferTimer, setActiveTransferTimer] = useState(30)
  const [activeMinAmount, setActiveMinAmount] = useState(2000)
  const [adminPin, setAdminPin] = useState("") // Store PIN for config saves

  useEffect(() => {
    // No auto-check needed, user must enter PIN
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          const settings = data.settings

          setActiveAlias(settings.alias || "")
          setActivePhone(settings.phone || "")
          setActivePaymentType(settings.paymentType || "alias")
          setActiveUserCreationEnabled(settings.createUserEnabled ?? true)
          setActiveTransferTimer(settings.timerSeconds ?? 30)
          setActiveMinAmount(settings.minAmount ?? 2000)

          setAlias(settings.alias || "")
          setPaymentType(settings.paymentType || "alias")
          setUserCreationEnabled(settings.createUserEnabled ?? true)
          setTransferTimer(String(settings.timerSeconds ?? 30))
          setMinAmount(String(settings.minAmount ?? 2000))

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

  const handleSave = async () => {
    const phoneValue = sanitizePhone(supportPhone.trim())

    if (!phoneValue || phoneValue.length < 8) {
      alert("Ingresá un teléfono válido (mínimo 8 dígitos)")
      return
    }

    if (phoneValue.length > 15) {
      alert("El teléfono no puede tener más de 15 dígitos")
      return
    }

    if (paymentType === "cbu") {
      if (alias.length !== 22) {
        alert("El CBU debe tener exactamente 22 dígitos")
        return
      }
      if (!/^\d{22}$/.test(alias)) {
        alert("El CBU solo debe contener números")
        return
      }
    }

    if (paymentType === "alias") {
      const sanitized = sanitizeAlias(alias.trim())
      if (!sanitized || sanitized.length < 6) {
        alert("Ingresá un alias válido (mínimo 6 caracteres)")
        return
      }
      if (!/^[A-Za-z0-9.-]+$/.test(sanitized)) {
        alert("El alias solo puede contener letras, números, puntos y guiones")
        return
      }
    }

    const transferTimerNum = Number(transferTimer)
    if (isNaN(transferTimerNum) || transferTimerNum < 0 || transferTimerNum > 300) {
      alert("El temporizador debe estar entre 0 y 300 segundos")
      return
    }

    const minAmountNum = Number(minAmount)
    if (isNaN(minAmountNum) || minAmountNum < 0) {
      alert("El monto mínimo debe ser un número válido mayor o igual a 0")
      return
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          alias: alias.trim(),
          phone: phoneValue,
          paymentType: paymentType,
          createUserEnabled: userCreationEnabled,
          timerSeconds: transferTimerNum,
          minAmount: minAmountNum,
          pin: adminPin,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar la configuración")
      }

      const data = await response.json()

      if (data.success) {
        setActiveAlias(alias.trim())
        setActivePhone(phoneValue)
        setActivePaymentType(paymentType)
        setActiveUserCreationEnabled(userCreationEnabled)
        setActiveTransferTimer(transferTimerNum)
        setActiveMinAmount(minAmountNum)

        const idx = Number(selectedContactIndex)
        if (idx >= 0 && idx < SUPPORT_CONTACTS.length) {
          setActiveContactName(SUPPORT_CONTACTS[idx].name)
        }

        alert(
          "✅ Configuración guardada exitosamente en Supabase.\nLos cambios son permanentes y se reflejan en todos los dispositivos.",
        )
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("❌ Error al guardar. Verificá tu conexión e intentá de nuevo.")
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="fixed inset-0 bg-gradient-to-br from-[#0d0a19] via-[#1a0f2e] to-[#2d1b4e] animate-[gradientShift_15s_ease_infinite]"
        style={{
          backgroundSize: "200% 200%",
        }}
      />

      <div className="fixed top-20 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />

      <div className="relative z-10 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          {!isAuthenticated ? (
            <Card className="border border-purple-500/30 shadow-2xl backdrop-blur-md bg-gradient-to-br from-purple-950/90 to-purple-900/85">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-6 h-6 text-amber-400" />
                  <CardTitle className="text-3xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent font-semibold">
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
                    className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-amber-400 focus:ring-amber-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="max-w-[320px] w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-black font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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
                    <Sparkles className="w-6 h-6 text-amber-400" />
                    <CardTitle className="text-3xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent font-semibold">
                      Configuración
                    </CardTitle>
                  </div>
                  <CardDescription className="text-purple-200/80">Modificá los parámetros del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="space-y-3 p-4 rounded-lg bg-purple-900/30 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-amber-300">Control de acceso</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="user-creation-toggle" className="text-base text-purple-100/90 font-medium">
                        Permitir creación de usuarios
                      </Label>
                      <Switch
                        id="user-creation-toggle"
                        checked={userCreationEnabled}
                        onCheckedChange={setUserCreationEnabled}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </div>
                    <p className="text-xs text-purple-300/70">
                      Cuando está desactivado, los usuarios no podrán crear nuevas cuentas
                    </p>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-purple-900/30 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-amber-300">Temporizador</h3>
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
                        className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-amber-400 focus:ring-amber-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                      />
                      <p className="text-xs text-purple-300/70">
                        Tiempo de espera en la sección "Esperando transferencia" (0-300 segundos)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-purple-900/30 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-amber-300">Monto mínimo</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-amount" className="text-base text-purple-100/90 font-medium">
                        Monto mínimo de carga ($)
                      </Label>
                      <Input
                        id="min-amount"
                        type="text"
                        inputMode="numeric"
                        value={minAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          setMinAmount(value)
                        }}
                        placeholder="0"
                        className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-amber-400 focus:ring-amber-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                      />
                      <p className="text-xs text-purple-300/70">Monto mínimo requerido para realizar una carga</p>
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
                            className="w-4 h-4 text-amber-400 border-purple-500/30 focus:ring-amber-400/50"
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
                            className="w-4 h-4 text-amber-400 border-purple-500/30 focus:ring-amber-400/50"
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
                                ? "text-amber-400"
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
                      className={`h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-amber-400 focus:ring-amber-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50 ${
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

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-amber-300">Contacto de soporte</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cfg-support-select" className="text-base text-purple-100/90 font-semibold">
                        Seleccionar contacto
                      </Label>
                      <Select value={selectedContactIndex} onValueChange={handleContactChange}>
                        <SelectTrigger
                          id="cfg-support-select"
                          className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-amber-400 focus:ring-amber-400/50 transition-all duration-200 text-white"
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
                        className="h-12 text-base bg-purple-950/50 border-purple-500/30 focus:border-amber-400 focus:ring-amber-400/50 transition-all duration-200 text-white placeholder:text-purple-300/50"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      id="btn-save-cfg"
                      onClick={handleSave}
                      disabled={paymentType === "cbu" && alias.length !== 22}
                      className="flex-1 h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-black font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar cambios
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="flex-1 h-12 border-purple-500/30 hover:bg-purple-900/30 hover:border-amber-400 transition-all duration-200 text-purple-200 bg-transparent"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar sesión
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {(activeAlias || activePhone) && (
                <Card className="border border-amber-500/30 shadow-lg backdrop-blur-md bg-gradient-to-br from-amber-950/80 to-amber-900/75">
                  <CardHeader className="space-y-1 pb-2 pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <CardTitle className="text-lg bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent font-semibold">
                        Configuración Activa
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-amber-200/70 font-medium min-w-[120px]">Crear usuarios:</Label>
                      <div className="h-8 px-3 rounded-md bg-amber-950/50 border border-amber-500/30 flex items-center flex-1">
                        <span className="text-sm text-amber-100">
                          {activeUserCreationEnabled ? "Activado" : "Desactivado"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-amber-200/70 font-medium min-w-[120px]">Temporizador:</Label>
                      <div className="h-8 px-3 rounded-md bg-amber-950/50 border border-amber-500/30 flex items-center flex-1">
                        <span className="text-sm text-amber-100">{activeTransferTimer}s</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-amber-200/70 font-medium min-w-[120px]">Monto mínimo:</Label>
                      <div className="h-8 px-3 rounded-md bg-amber-950/50 border border-amber-500/30 flex items-center flex-1">
                        <span className="text-sm text-amber-100">${activeMinAmount}</span>
                      </div>
                    </div>
                    {activeAlias && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-amber-200/70 font-medium min-w-[120px]">
                          {activePaymentType === "alias" ? "Alias:" : "CBU:"}
                        </Label>
                        <div className="h-8 px-3 rounded-md bg-amber-950/50 border border-amber-500/30 flex items-center flex-1">
                          <span className="text-sm text-amber-100 truncate">{activeAlias}</span>
                        </div>
                      </div>
                    )}
                    {activePhone && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-amber-200/70 font-medium min-w-[120px]">Soporte:</Label>
                        <div className="h-8 px-3 rounded-md bg-amber-950/50 border border-amber-500/30 flex items-center flex-1">
                          <span className="text-sm text-amber-100 truncate">{activeContactName}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
