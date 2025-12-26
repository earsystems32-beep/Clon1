"use client"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Check,
  Copy,
  StarsIcon,
  Crown,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  DollarSign,
  X,
  Hourglass,
  Gift,
  Shield,
  Users,
  AlertTriangle,
} from "lucide-react"

const SUPPORT_CONTACTS = [
  { name: "Linea 1", phone: "541176067205" },
  { name: "Linea 2", phone: "541127214473" },
  { name: "Linea 3", phone: "541166848706" },
  { name: "Linea 4", phone: "541176067761" },
  { name: "Linea 5", phone: "541127419425" },
  { name: "Linea 6", phone: "541171002343" },
  { name: "Linea 7", phone: "541166891411" },
]

export default function Home() {
  const [step, setStep] = useState(1)
  const [apodo, setApodo] = useState("")
  const [digitos, setDigitos] = useState("")
  const [plataforma, setPlataforma] = useState("")
  const [usuario, setUsuario] = useState("")
  const [transferTime, setTransferTime] = useState("")
  const [titular, setTitular] = useState("")
  const [monto, setMonto] = useState("")
  const [copiedAlias, setCopiedAlias] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [apodoError, setApodoError] = useState("")
  const [plataformaError, setPlataformaError] = useState("")
  const [titularError, setTitularError] = useState("")
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [isStepAnimating, setIsStepAnimating] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [transferButtonTimer, setTransferButtonTimer] = useState(30)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [isBonusModalAnimating, setIsBonusModalAnimating] = useState(false)
  const [bonusAccepted, setBonusAccepted] = useState(false)
  const [timerHasStarted, setTimerHasStarted] = useState(false)
  const [bonusPercentage, setBonusPercentage] = useState(25)
  const [isBonusEnabled, setIsBonusEnabled] = useState(true)

  const [alias, setAlias] = useState("")
  const [minAmount, setMinAmount] = useState(2000)
  const [userCreationEnabled, setUserCreationEnabled] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState("541176067205")
  const [paymentType, setPaymentType] = useState<"alias" | "cbu">("alias")
  const [originalTimerSeconds, setOriginalTimerSeconds] = useState(30)
  const [supportPhone, setSupportPhone] = useState("+541141624225")

  useEffect(() => {
    const checkRotation = async () => {
      try {
        const response = await fetch("/api/rotation", {
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.rotationEnabled) {
            // Update phone number based on current line index
            const currentLine = SUPPORT_CONTACTS[data.currentLineIndex]
            if (currentLine) {
              setPhoneNumber(currentLine.phone)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error checking rotation:", error)
      }
    }

    // Check rotation immediately on mount
    checkRotation()

    // Check rotation every minute
    const rotationInterval = setInterval(checkRotation, 60000)

    return () => clearInterval(rotationInterval)
  }, [])

  // Separated config loading to only set timer when not in use
  useEffect(() => {
    const loadServerConfig = async () => {
      try {
        const response = await fetch(`/api/admin/settings?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.settings) {
            setAlias(data.settings.alias)

            if (!data.settings.autoRotationEnabled) {
              setPhoneNumber(data.settings.phone)
            }

            setPaymentType(data.settings.paymentType)
            setUserCreationEnabled(data.settings.createUserEnabled ?? true)
            const timerValue = data.settings.timerSeconds ?? 30
            setOriginalTimerSeconds(timerValue)

            // Only update transferButtonTimer if timer hasn't started yet
            if (!timerHasStarted) {
              setTransferButtonTimer(timerValue)
            }

            setMinAmount(data.settings.minAmount ?? 2000)
            setSupportPhone(data.settings.supportPhone || "+541141624225")
          }
        }
      } catch (error) {
        // Silent fail - use defaults
      }
    }

    loadServerConfig()
    const interval = setInterval(loadServerConfig, 15000)
    return () => clearInterval(interval)
  }, [timerHasStarted])

  const password = "aaa111"

  const paymentLabel = paymentType === "alias" ? "Alias" : "CBU"
  const minAmountStr = String(minAmount)

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add("dark")

      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual"
      }

      window.scrollTo({ top: 0, left: 0, behavior: "instant" })

      const savedUsername = localStorage.getItem("eds_username")
      if (savedUsername) {
        setUsuario(savedUsername)
      }
      const savedTime = localStorage.getItem("eds_transfer_time")
      if (savedTime) {
        setTransferTime(savedTime)
      }
    }
  }, [])

  useEffect(() => {
    if (step === 2) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" })

    // Initialize timer only on first entry to step 4
    if (step === 4) {
      if (!timerHasStarted) {
        setTransferButtonTimer(originalTimerSeconds)
        setTimerHasStarted(true)

        setShowBonusModal(true)
        setTimeout(() => setIsBonusModalAnimating(true), 10)
      }
    }

    // Reset timer state when leaving step 4
    if (step !== 4 && timerHasStarted) {
      setTimerHasStarted(false)
      setBonusAccepted(false)
    }
  }, [step, originalTimerSeconds, timerHasStarted])

  // Countdown timer runs only when conditions are met
  useEffect(() => {
    if (step === 4 && bonusAccepted && transferButtonTimer > 0) {
      const interval = setInterval(() => {
        setTransferButtonTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [step, bonusAccepted])

  // Fetch bonus settings and check if bonus is enabled
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/admin/settings", {
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.settings) {
            const settings = data.settings
            setMinAmount(settings.minAmount)
            setOriginalTimerSeconds(settings.timerSeconds)
            setUserCreationEnabled(settings.createUserEnabled)
            setAlias(settings.alias || "")

            if (!settings.autoRotationEnabled) {
              setPhoneNumber(settings.phone || "541176067205")
            }

            setPaymentType(settings.paymentType || "alias")
            setBonusPercentage(settings.bonusPercentage ?? 25)
            setIsBonusEnabled(settings.bonusEnabled ?? true)
            setSupportPhone(settings.supportPhone || "+541141624225")
          }
        }
      } catch (error) {
        console.error("Error fetching config:", error)
        // Use defaults if fetch fails
        setMinAmount(2000)
        setOriginalTimerSeconds(30)
        setUserCreationEnabled(true)
        setAlias("")
        setPhoneNumber("541176067205")
        setPaymentType("alias")
        setSupportPhone("+541141624225")
      }
    }

    fetchConfig()
  }, [])

  useEffect(() => {
    const isNewUser = !localStorage.getItem("hasSeenBonusModal")
    if (isNewUser && !bonusAccepted && isBonusEnabled) {
      const timer = setTimeout(() => {
        setShowBonusModal(true)
        setTimeout(() => setIsBonusModalAnimating(true), 10)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [bonusAccepted, isBonusEnabled])

  const isApodoValid = useCallback((value: string) => {
    return /^[A-Za-zÀ-ÿ\s]+$/.test(value.trim())
  }, [])

  const isDigitosValid = useCallback((value: string) => {
    return /^\d{4}$/.test(value)
  }, [])

  const isPlataformaValid = useCallback((value: string) => {
    return value === "g" // Simplified platform logic to only support GoldNET
  }, [])

  const isFormValid = isApodoValid(apodo) && isDigitosValid(digitos) && isPlataformaValid(plataforma)

  useEffect(() => {
    if (isApodoValid(apodo) && isDigitosValid(digitos) && !isPlataformaValid(plataforma) && plataforma === "") {
      setPlataformaError("Elegí una opción para continuar.")
    } else if (plataforma !== "" && !isPlataformaValid(plataforma)) {
      setPlataformaError("Elegí una opción para continuar.")
    } else {
      setPlataformaError("")
    }
  }, [apodo, digitos, plataforma, isApodoValid, isDigitosValid, isPlataformaValid])

  const sanitizeName = useCallback((str: string) => {
    const soloLetrasEspacios = str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
    return soloLetrasEspacios.replace(/\s+/g, "")
  }, [])

  const formatDateTime = useCallback((d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const year = d.getFullYear()
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }, [])

  const formatMontoArgentino = useCallback((value: string): string => {
    const cleaned = value.replace(/[^\d.,]/g, "")
    const normalized = cleaned.replace(",", ".")
    const num = Number.parseFloat(normalized)

    if (isNaN(num)) return value

    const parts = num.toFixed(2).split(".")
    const integerPart = parts[0]
    const decimalPart = parts[1]

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    if (decimalPart && decimalPart !== "00") {
      return `${formattedInteger},${decimalPart}`
    }

    return formattedInteger
  }, [])

  const handleApodoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.normalize("NFD").replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    setApodo(cleaned)

    if (cleaned !== value) {
      setApodoError("Usá solo letras.")
    } else {
      setApodoError("")
    }
  }, [])

  const handleTitularChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.normalize("NFD").replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    setTitular(cleaned)

    if (cleaned !== value) {
      setTitularError("Usá solo letras.")
    } else {
      setTitularError("")
    }
  }, [])

  const handleCreateUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!isApodoValid(apodo)) {
        alert("Usá solo letras.")
        return
      }
      if (!isDigitosValid(digitos)) {
        alert("Ingresá 4 dígitos.")
        return
      }
      if (!isPlataformaValid(plataforma)) {
        setPlataformaError("Elegí una opción para continuar.")
        alert("Elegí una opción de plataforma.")
        return
      }

      const apodoSan = sanitizeName(apodo)
      const apodoCapitalized = apodoSan.charAt(0).toUpperCase() + apodoSan.slice(1)
      const generatedUser = `${apodoCapitalized}${digitos}${plataforma}01`
      setUsuario(generatedUser)
      localStorage.setItem("eds_username", generatedUser)
      localStorage.setItem("eds_platform", plataforma)
      changeStep(3)
    },
    [apodo, digitos, plataforma, isApodoValid, isDigitosValid, isPlataformaValid, sanitizeName],
  )

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAlias(true)
    setShowToast(true)
    setTimeout(() => {
      setCopiedAlias(false)
      setShowToast(false)
    }, 1500)
  }, [])

  const handleTransferConfirmation = useCallback(() => {
    const now = new Date()
    const formattedTime = formatDateTime(now)
    localStorage.setItem("eds_transfer_time", formattedTime)
    setTransferTime(formattedTime)
    changeStep(5)
  }, [formatDateTime])

  const openWhatsApp = useCallback(() => {
    const username = localStorage.getItem("eds_username") || ""
    if (!username) {
      alert("Generá tu usuario primero")
      return
    }

    if (!titular.trim() || !monto.trim()) {
      alert("Completá los datos de titular y monto antes de continuar.")
      return
    }

    const time = localStorage.getItem("eds_transfer_time") || "sin hora registrada"
    const montoFormateado = formatMontoArgentino(monto)
    const platform = localStorage.getItem("eds_platform") || ""
    const platformName = platform === "g" ? "https://goldnet.app/login.php" : "No especificada"

    const msg = `Hola, ya envié mi carg4.\n\nUsu4rio: ${username}\nContr4seña: ${password}\nQuiero jug4r en: \n${platformName}\n\nTitular: ${titular}\nMonto: $${montoFormateado}\nHora de transferencia: ${time}\nAdjunto comprobante.`
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`
    window.open(url, "_blank")
  }, [titular, monto, formatMontoArgentino, password, phoneNumber])

  const openInfoModal = useCallback(() => {
    setShowInfoModal(true)
    setTimeout(() => setIsModalAnimating(true), 10)
    sessionStorage.setItem("info_seen", "true")
  }, [])

  const closeInfoModal = useCallback(() => {
    setIsModalAnimating(false)
    setTimeout(() => setShowInfoModal(false), 300)
  }, [])

  const isSoporteButtonEnabled = titular.trim().length > 0 && monto.trim().length > 0

  const changeStep = useCallback((newStep: number) => {
    setIsStepAnimating(false)
    setTimeout(() => {
      setStep(newStep)
      setTimeout(() => setIsStepAnimating(true), 10)
    }, 300)
  }, [])

  const handleInputBlur = useCallback(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
      }, 100)
    }
  }, [])

  const closeBonusModal = useCallback(() => {
    setIsBonusModalAnimating(false)
    setTimeout(() => {
      setShowBonusModal(false)
      setBonusAccepted(true)
      // Set flag to prevent showing modal again
      localStorage.setItem("hasSeenBonusModal", "true")
    }, 300)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for reset query parameter (for testing)
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("resetBonus") === "1") {
        localStorage.removeItem("bonus20_seen")
      }
    }
  }, [])

  return (
    <div className="min-h-[100svh] relative overflow-hidden pb-16">
      {isDropdownOpen && <div className="fixed inset-0 z-50 bg-transparent" onClick={() => setIsDropdownOpen(false)} />}

      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-md bg-[#1a1a1a] rounded-2xl shadow-2xl transition-all duration-300 ${
              isBonusModalAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Gift className="w-8 h-8 text-[#22D3EE]" strokeWidth={2.5} />
                <h2 className="text-2xl font-bold text-[#22D3EE]">Felicitaciones! </h2>
                <p className="text-white">Tenemos un bono especial para vos:</p>

                <div className="bg-gradient-to-br from-[#22D3EE]/20 to-[#00BFFF]/10 border-2 border-[#22D3EE]/30 rounded-xl p-6 px-6 py-3">
                  <p className="text-3xl font-bold text-[#22D3EE] mb-2">{bonusPercentage}% Adicional</p>
                  <p className="text-lg text-white font-semibold">¡En tu primera carga!</p>
                </div>

                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-white/10 py-1">
                  <p className="text-sm text-white/90 leading-relaxed">
                    Recordá, el bono <span className="font-bold text-[#22D3EE]">no forma parte del premio</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={closeBonusModal}
                className="w-full h-12 bg-gradient-to-b from-[#22D3EE] to-[#00BFFF] hover:from-[#67E8F9] hover:to-[#22D3EE] text-black font-bold rounded-lg transition-all duration-200 shadow-lg text-base"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-md bg-[#1a1a1a] rounded-2xl shadow-2xl transition-all duration-300 ${
              isModalAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <button
              onClick={closeInfoModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Crown
                  className="w-6 h-6 text-primary"
                  strokeWidth={2.5}
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))",
                  }}
                />
                <CardTitle className="text-2xl font-bold text-[#22D3EE]">Información y cronograma</CardTitle>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hourglass className="w-6 h-6 text-[#22D3EE] shrink-0 mt-1" strokeWidth={2} />
                  <div>
                    <h3 className="font-bold text-white mb-1">Retiros programados</h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Se habilitan hasta 2 retiros diarios, con un monto máximo de $125.000 por cada retiro.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-[#22D3EE] shrink-0 mt-1" strokeWidth={2} />
                  <div>
                    <h3 className="font-bold text-white mb-1">Límite diario de retiros</h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                      El total máximo disponible para retirar es de $250.000 cada 24 horas, independientemente de la
                      cantidad de operaciones.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#22D3EE] shrink-0 mt-1" strokeWidth={2} />
                  <div>
                    <h3 className="font-bold text-white mb-1">Disponibilidad de acreditación</h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Los pagos se procesan dentro del mismo día, sujetos a la demanda y a la disponibilidad del equipo
                      de soporte.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-[#22D3EE] shrink-0 mt-1" strokeWidth={2} />
                  <div>
                    <h3 className="font-bold text-white mb-1">Soporte activo</h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Ante cualquier duda, podés comunicarte con un operador para asistencia personalizada.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/60 italic leading-relaxed">{""}</p>

              <button
                onClick={closeInfoModal}
                className="w-full h-12 bg-gradient-to-b from-[#22D3EE] to-[#00BFFF] hover:from-[#67E8F9] hover:to-[#22D3EE] text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#000000] animate-[gradientShift_15s_ease_infinite] text-gray-950 opacity-100"
        style={{
          backgroundSize: "200% 200%",
        }}
      />
      <div className="fixed top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />

      <div className="relative z-10">
        {step === 1 && (
          <div
            className={`transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isStepAnimating
                ? "opacity-100 translate-y-0 scale-100 blur-0 rotate-0"
                : "opacity-0 translate-y-8 scale-90 blur-sm -rotate-1"
            }`}
          >
            <div className="py-12 px-3">
              <Card className="shadow-md backdrop-blur-md bg-card/90 border-transparent p-3 px-0">
                <CardContent className="space-y-6 pt-12 pb-12">
                  <div className="flex items-center justify-center mb-4">
                    <StarsIcon
                      className="w-12 h-12 text-primary animate-pulse"
                      strokeWidth={2.5}
                      style={{
                        filter: "drop-shadow(0 0 12px rgba(34, 211, 238, 0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                      }}
                    />
                  </div>
                  {/* CHANGE: Changed title gradient from orange to cyan/blue */}
                  <h1
                    className="text-5xl md:text-6xl font-semibold text-center"
                    style={{
                      background: "linear-gradient(180deg, #67E8F9 0%, #22D3EE 50%, #0284C7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 20px rgba(34, 211, 238, 0.3))",
                      textShadow: "0 2px 8px rgba(14, 165, 233, 0.4)",
                    }}
                  >
                    {"LUX23"}
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground font-normal text-center">
                    Creá tu usuario y empezá a jugar!
                  </p>
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <button
                      onClick={() => (userCreationEnabled ? changeStep(2) : null)}
                      disabled={!userCreationEnabled}
                      className={`btn-liquid-glass max-w-[320px] min-w-[240px] h-12 px-5 text-base rounded-lg transition-all duration-200 leading-tight truncate text-black font-bold ${
                        !userCreationEnabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {userCreationEnabled ? "Crear mi usuario" : "Intente más tarde"}
                    </button>
                    <Button
                      onClick={openInfoModal}
                      variant="outline"
                      className="max-w-[320px] min-w-[240px] h-12 text-base border-border hover:bg-muted hover:border-primary/50 transition-all duration-200 font-normal text-muted-foreground bg-transparent"
                    >
                      Información y cronograma
                    </Button>
                    <Button
                      onClick={() => changeStep(7)} // Changed to navigate to step 7 instead of scrolling
                      variant="outline"
                      className="max-w-[320px] min-w-[240px] h-12 text-base border-border hover:bg-muted hover:border-primary/50 transition-all duration-200 font-normal text-muted-foreground bg-transparent"
                    >
                      Soporte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div
            className={`transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isStepAnimating
                ? "opacity-100 translate-y-0 scale-100 blur-0 rotate-0"
                : "opacity-0 translate-y-8 scale-90 blur-sm -rotate-1"
            }`}
          >
            <div className="py-12 px-3">
              <Card className="shadow-md backdrop-blur-md bg-card/90 border-transparent p-3 px-0">
                <CardHeader className="space-y-3 pt-3 pb-0">
                  <CardTitle className="text-3xl text-primary font-semibold">Crear Usuario</CardTitle>
                  <CardDescription className="text-muted-foreground">Completá tus datos para continuar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <form onSubmit={handleCreateUser} className="space-y-6">
                    <div id="plataforma-wrapper" className="space-y-2 relative z-10 mb-4">
                      <Label htmlFor="plataforma" className="text-base text-card-foreground font-semibold">
                        Elegí tu plataforma favorita
                      </Label>
                      <Select
                        value={plataforma}
                        onValueChange={(value) => {
                          setPlataforma(value)
                          setPlataformaError("")
                          setIsDropdownOpen(false)
                        }}
                        required
                        onOpenChange={(open) => {
                          setIsDropdownOpen(open)
                        }}
                      >
                        <SelectTrigger
                          id="plataforma"
                          className="h-12 text-base bg-input border-border focus:border-primary focus:ring-primary/50 transition-all duration-200 text-foreground"
                        >
                          <SelectValue placeholder="Seleccioná una opción" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          {/* Changed platform option to GoldNET */}
                          <SelectItem value="g">GoldNET</SelectItem>
                        </SelectContent>
                      </Select>
                      {plataformaError && (
                        <small id="plataforma-help" className="text-sm text-destructive block">
                          {plataformaError}
                        </small>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apodo" className="text-base text-card-foreground font-semibold">
                        Apodo
                      </Label>
                      <Input
                        id="apodo"
                        type="text"
                        value={apodo}
                        onChange={handleApodoChange}
                        onBlur={handleInputBlur}
                        autoComplete="off"
                        required
                        placeholder="Tu apodo"
                        pattern="[A-Za-zÀ-ÿ\s]+"
                        className="h-12 text-base bg-input border-border focus:border-primary focus:ring-primary/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                      />
                      {apodoError && <p className="text-sm text-destructive mt-1">{apodoError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digitos" className="text-base text-card-foreground font-semibold">
                        Últimos 4 dígitos del celular
                      </Label>
                      <Input
                        id="digitos"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{4}"
                        maxLength={4}
                        value={digitos}
                        onChange={(e) => setDigitos(e.target.value.replace(/\D/g, ""))}
                        onBlur={handleInputBlur}
                        autoComplete="off"
                        required
                        placeholder="1234"
                        className="h-12 text-base bg-input border-border focus:border-primary focus:ring-primary/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div
                      className={`flex flex-col items-center gap-3 pt-4 transition-all duration-200 ${
                        isDropdownOpen ? "pointer-events-none opacity-50" : "pointer-events-auto opacity-100"
                      }`}
                    >
                      <button
                        type="submit"
                        disabled={!isFormValid || isDropdownOpen}
                        className={`btn-liquid-glass max-w-[320px] min-w-[240px] w-full h-12 px-5 font-semibold text-base rounded-lg transition-all duration-200 leading-tight truncate text-black ${
                          !isFormValid || isDropdownOpen ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Crear Usuario
                      </button>
                      {!isFormValid && (
                        <p className="text-xs text-muted-foreground text-center">
                          Completá todos los campos correctamente para continuar
                        </p>
                      )}
                      <Button
                        type="button"
                        onClick={() => changeStep(1)}
                        variant="outline"
                        disabled={isDropdownOpen}
                        className="max-w-[320px] min-w-[240px] w-full h-12 text-base border-border hover:bg-muted hover:border-primary/50 transition-all duration-200 text-foreground font-bold"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al inicio
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 3 && (
          <div
            className={`transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isStepAnimating
                ? "opacity-100 translate-y-0 scale-100 blur-0 rotate-0"
                : "opacity-0 translate-y-8 scale-90 blur-sm -rotate-1"
            }`}
          >
            <div className="py-12 px-3">
              <Card className="shadow-md backdrop-blur-md bg-card/90 border-transparent p-3 px-0">
                <CardHeader className="space-y-3 pt-3 pb-0">
                  <div className="flex items-center gap-2">
                    <Crown
                      className="w-6 h-6 text-primary"
                      strokeWidth={2.5}
                      style={{
                        filter: "drop-shadow(0 0 8px rgba(255, 140, 0, 0.5))",
                      }}
                    />
                    <CardTitle className="text-3xl text-primary font-semibold">¡Usuario Creado!</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">Tu usuario fue creado con éxito</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-card-foreground">Usuario</Label>
                      <Input
                        value={usuario}
                        readOnly
                        className="h-12 text-base font-mono bg-input border-border text-primary font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-card-foreground">Contraseña</Label>
                      <Input
                        value={password}
                        readOnly
                        className="h-12 text-base font-mono bg-input border-border text-primary font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-center">
                      <button
                        onClick={() => changeStep(4)}
                        className="btn-liquid-glass max-w-[320px] min-w-[240px] w-full h-12 px-5 font-semibold text-base rounded-lg transition-all duration-200 leading-tight truncate text-black"
                      >
                        Ir a pagar
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        onClick={() => changeStep(2)}
                        variant="outline"
                        className="max-w-[320px] min-w-[240px] w-full h-12 text-base border-border hover:bg-muted hover:border-primary/50 transition-all duration-200 text-foreground font-bold"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Atrás
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 4 && (
          <div
            className={`transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isStepAnimating
                ? "opacity-100 translate-y-0 scale-100 blur-0 rotate-0"
                : "opacity-0 translate-y-8 scale-90 blur-sm -rotate-1"
            }`}
          >
            <div className="py-12 px-3">
              <Card className="border-transparent shadow-md backdrop-blur-md bg-card/90 p-3 px-0">
                <CardHeader className="space-y-3 pt-3 pb-0">
                  <CardTitle className="text-3xl text-primary font-semibold">Enviá tu carga</CardTitle>
                  <CardDescription className="text-muted-foreground text-base">
                    Monto mínimo: ${minAmountStr}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="space-3">
                    <Label className="text-base font-semibold text-card-foreground">{paymentLabel}: </Label>
                    <div className="relative">
                      <Input
                        value={alias}
                        readOnly
                        className="h-12 font-mono bg-input border-border text-center text-primary font-bold pr-16 text-base"
                      />
                      <Button
                        onClick={() => copyToClipboard(alias)}
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-primary/20 transition-all duration-200"
                      >
                        {copiedAlias ? (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <Copy className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <button
                      id="btn-transfer-done"
                      onClick={handleTransferConfirmation}
                      disabled={transferButtonTimer > 0}
                      className={`max-w-[320px] min-w-[240px] w-full h-12 px-5 font-semibold text-base rounded-lg transition-all duration-200 leading-tight truncate flex items-center justify-center gap-2 ${
                        transferButtonTimer > 0
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "btn-liquid-glass text-black"
                      }`}
                    >
                      {transferButtonTimer > 0 ? (
                        <>
                          <Hourglass className="w-5 h-5 shrink-0 animate-spin" />
                          <span className="truncate">Esperando transferencia</span>
                        </>
                      ) : (
                        <span className="truncate">Ya envié el dinero</span>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 5 && (
          <div
            className={`transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isStepAnimating
                ? "opacity-100 translate-y-0 scale-100 blur-0 rotate-0"
                : "opacity-0 translate-y-8 scale-90 blur-sm -rotate-1"
            }`}
          >
            <div className="px-3 py-12">
              <Card className="border-transparent shadow-md backdrop-blur-md bg-card/90 p-3 px-0 py-3">
                <CardHeader className="space-y-3 pt-3 pb-0">
                  <CardTitle className="text-3xl text-primary font-semibold">Último paso!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pb-8 pt-0">
                  <div className="space-3 py-0">
                    <div className="space-y-2">
                      <Label htmlFor="titular" className="text-base text-card-foreground font-semibold">
                        Nombre del titular:
                      </Label>
                      <Input
                        id="titular"
                        type="text"
                        value={titular}
                        onChange={handleTitularChange}
                        onBlur={handleInputBlur}
                        placeholder="Ejemplo: Juan Pérez"
                        pattern="[A-Za-zÀ-ÿ\s]+"
                        required
                        className="text-base bg-input border-border focus:border-primary focus:ring-primary/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground h-12"
                      />
                      {titularError && <p className="text-sm text-destructive mt-1">{titularError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monto" className="text-base text-card-foreground font-semibold">
                        Monto enviado:
                      </Label>
                      <Input
                        id="monto"
                        type="text"
                        inputMode="numeric"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
                        onBlur={handleInputBlur}
                        placeholder="Ejemplo: 5000"
                        required
                        className="text-base bg-input border-border focus:border-primary focus:ring-primary/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground h-12 py-0"
                      />
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 flex-row py-3 my-5">
                      <AlertCircle className="w-5 text-primary shrink-0 h-5 mb-0 border-0 mt-6" />
                      <p className="text-sm leading-relaxed text-primary font-medium">
                        Asegurate de ingresar los mismos datos de tu transferencia para evitar demoras en la
                        acreditación.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-card-foreground py-0 my-3">Enviar a soporte:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 py-0">
                        <CheckCircle className="w-4 h-4 text-primary" strokeWidth={2} />
                        <span className="text-sm text-muted-foreground">Comprobante de pago</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      id="btn-acreditar"
                      onClick={openWhatsApp}
                      disabled={!isSoporteButtonEnabled}
                      className="btn-liquid-glass max-w-[320px] min-w-[240px] w-full h-12 px-5 font-semibold text-base rounded-lg transition-all duration-200 leading-tight truncate text-black flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5 shrink-0" />
                      <span className="truncate">Acreditar mi carga</span>
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => changeStep(6)}
                      variant="outline"
                      className="max-w-[320px] min-w-[240px] w-full h-12 text-base border-border hover:bg-muted hover:border-primary transition-all duration-200 font-normal text-foreground"
                    >
                      Ver preguntas frecuentes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 6 && (
          <div
            className={`transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isStepAnimating
                ? "opacity-100 translate-y-0 scale-100 blur-0 rotate-0"
                : "opacity-0 translate-y-8 scale-90 blur-sm -rotate-1"
            }`}
          >
            <div className="py-12 px-3">
              <Card className="border-transparent shadow-md backdrop-blur-md bg-card/90 p-3 px-0">
                <CardHeader className="space-y-3 pt-3 pb-6">
                  <CardTitle className="text-3xl text-primary font-semibold">Preguntas Frecuentes</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Encontrá respuestas a las dudas más comunes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-border">
                      <AccordionTrigger className="text-left text-card-foreground hover:text-primary transition-colors duration-200 font-semibold">
                        ¿Cuánto tarda en acreditarse mi carga?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        Las cargas se acreditan en un plazo de 5 a 30 minutos después de enviar el comprobante al
                        soporte. En horarios pico puede demorar un poco más.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border-border">
                      <AccordionTrigger className="text-left text-card-foreground hover:text-primary transition-colors duration-200 font-semibold">
                        ¿Puedo cargar desde otra cuenta?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        Sí, podés cargar desde cualquier cuenta bancaria o billetera virtual. Solo asegurate de enviar
                        el comprobante con tu usuario correcto.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border-border">
                      <AccordionTrigger className="text-left text-card-foreground hover:text-primary transition-colors duration-200 font-semibold">
                        ¿Qué hago si me equivoqué de monto?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        Contactá inmediatamente al soporte por WhatsApp explicando la situación. El equipo te ayudará a
                        resolver el problema.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4" className="border-border">
                      <AccordionTrigger className="text-left text-card-foreground hover:text-primary transition-colors duration-200 font-semibold">
                        ¿Qué horario tiene el soporte?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        El soporte está disponible de lunes a domingo de 9:00 a 23:00 hs. Fuera de ese horario, podés
                        enviar tu mensaje y te responderán a la brevedad.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center pt-6">
              <button
                onClick={() => changeStep(5)}
                className="btn-liquid-glass max-w-[320px] min-w-[240px] w-full h-12 px-5 font-semibold text-base rounded-lg transition-all duration-200 leading-tight truncate text-black flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" />
                <span className="truncate">Volver</span>
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div
            className={`transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isStepAnimating
                ? "opacity-100 translate-y-0 scale-100 blur-0 rotate-0"
                : "opacity-0 translate-y-8 scale-90 blur-sm -rotate-1"
            }`}
          >
            <div className="py-12 px-3">
              <Card className="shadow-md backdrop-blur-md bg-card/90 border-transparent p-3 px-0">
                <CardHeader className="space-y-3 pt-3 pb-0">
                  <div className="flex justify-center mb-2">
                    <MessageCircle className="w-10 h-10 text-primary" strokeWidth={2} />
                  </div>
                  <CardTitle className="text-3xl text-primary font-semibold text-center">
                    Bienvenido a soporte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4 pb-8">
                  <p className="text-center text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                    Podés comunicarte con nuestro número de atención para reclamos y consultas. Te ayudamos a resolver
                    cualquier inconveniente con tus fichas, accesos o promociones.
                  </p>

                  <div className="flex flex-col items-center gap-3 pt-2">
                    <a
                      href={`https://wa.me/${supportPhone.replace(/\+/g, "")}?text=Hola,%20me%20contacto%20desde%20https://goldnet.app/login.php%20por%20un%20reclamo%20o%20consulta%20de%20soporte.%20¿Me%20podrías%20ayudar?`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-liquid-glass max-w-[320px] min-w-[240px] w-full h-12 px-5 font-semibold text-base rounded-lg transition-all duration-200 leading-tight truncate text-black flex items-center justify-center gap-2"
                    >
                      Contactar con soporte
                    </a>

                    <Button
                      onClick={() => changeStep(1)}
                      variant="outline"
                      className="max-w-[320px] min-w-[240px] w-full h-12 text-base border-border hover:bg-muted hover:border-primary/50 transition-all duration-200 font-normal text-muted-foreground bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al inicio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-t border-[#22D3EE]/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-nowrap items-center justify-center gap-x-3 sm:gap-x-6 text-[10px] sm:text-xs md:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 text-white/80 whitespace-nowrap">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#22D3EE] shrink-0" strokeWidth={2.5} />
              <span className="font-medium">Pagos seguros</span>
            </div>
            <span className="text-[#22D3EE]/40 hidden xs:inline">•</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-white/80 whitespace-nowrap">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#22D3EE] shrink-0" strokeWidth={2.5} />
              <span className="font-medium">+10K usuarios</span>
            </div>
            <span className="text-[#22D3EE]/40 hidden xs:inline">•</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-white/80 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-[#22D3EE] shrink-0" strokeWidth={2.5} />
              <span className="font-medium">+18 Juega responsablemente</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
