"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { ColorPicker } from "@/components/color-picker"
import { ImageUpload } from "@/components/image-upload"
import { AlertTriangle, Download, RotateCcw } from "lucide-react"
import {
  CLASSIC_DESIGN,
  DEFAULT_LOGO_STYLE,
  EXPORT_FORMATS,
  EYE_BALLS,
  EYE_FRAMES,
  ExportFormat,
  LOGO_SHAPES,
  LogoStyle,
  QRDesign,
  QR_PRESETS,
  QR_SHAPES,
  UP,
  exportQR,
  qrFileName,
  BRAND,
  isHex,
  scanWarnings,
  shapePath,
} from "@/lib/qr-styles"

const STORAGE_KEY = "qrDesign"
const DOWNLOAD_SIZES = [512, 1024, 2048]
// Navy on cream: on-brand and scans everywhere, so first visits start with no warnings
const DEFAULT_DESIGN = QR_PRESETS.find((p) => p.id === "paper")!.design

const cardClass = "bg-card border border-up-border rounded-[20px] p-5 sm:p-6"

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[13px] leading-[1.4] font-bold uppercase tracking-[0.06em] ${className}`}>{children}</p>
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-medium text-up-muted mb-2">{children}</p>
}

// Selectable tile; used for presets and patterns
function Tile({ selected, onClick, label, children }: { selected: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-2 p-2 pb-2.5 rounded-[14px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up-navy ${
        selected ? "border-up-navy bg-up-cream" : "border-up-border hover:border-up-navy"
      }`}
    >
      {children}
      <span className="text-[13px] font-semibold leading-none">{label}</span>
    </button>
  )
}

// Pill chips for corner frame / center shapes, with icons drawn from the same paths as the code
function ShapeChips<T extends string>({
  options,
  value,
  onChange,
  frame,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  frame?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = o.id === value
        const d = frame
          ? shapePath(o.id as never, 2, 2, 20) + shapePath(o.id as never, 6, 6, 12)
          : shapePath(o.id as never, 5, 5, 14)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={selected}
            className={`flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-full border text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up-navy ${
              selected ? "bg-up-navy text-up-cream border-up-navy" : "bg-card text-up-navy border-up-border hover:border-up-navy"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d={d} fill="currentColor" fillRule="evenodd" />
            </svg>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Only push valid hex colors into the design; the field keeps whatever is being typed
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <ColorPicker
        color={draft}
        onChange={(v) => {
          setDraft(v)
          if (isHex(v)) onChange(v)
        }}
      />
    </div>
  )
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-50" : ""}`}>
      <Label htmlFor={id} className="text-[14px] font-medium">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

export default function QRCodeGeneratorPage() {
  const [url, setUrl] = useState("https://example.com")
  const [caption, setCaption] = useState("")
  const [design, setDesign] = useState<QRDesign>(DEFAULT_DESIGN)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [logoScale, setLogoScale] = useState([22])
  const [logoStyle, setLogoStyle] = useState<LogoStyle>(DEFAULT_LOGO_STYLE)
  const [downloadSize, setDownloadSize] = useState(1024)
  const [format, setFormat] = useState<ExportFormat>("png")
  const [transparent, setTransparent] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const update = (patch: Partial<QRDesign>) => setDesign((d) => ({ ...d, ...patch }))
  const updateLogo = (patch: Partial<LogoStyle>) => setLogoStyle((s) => ({ ...s, ...patch }))
  const warnings = scanWarnings(design)
  const activePreset = QR_PRESETS.find((p) => JSON.stringify(p.design) === JSON.stringify(design))?.id

  // Remember the last design in this browser
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
      if (saved && typeof saved === "object") setDesign({ ...CLASSIC_DESIGN, ...saved })
    } catch {
      // storage unavailable or corrupt; keep the default
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
    } catch {
      // storage unavailable; design just won't persist
    }
  }, [design, loaded])

  const handleDownload = async () => {
    setDownloadError(null)
    try {
      // Render a fresh copy at the chosen size rather than scaling the preview
      const blob = await exportQR(format, {
        value: url,
        size: format === "svg" ? 1024 : downloadSize,
        design,
        logoSrc: logoImage,
        logoScale: logoScale[0] / 100,
        logoStyle,
        caption,
        transparent: transparent && format !== "jpg",
      })
      const href = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = qrFileName(url, format)
      link.href = href
      link.click()
      setTimeout(() => URL.revokeObjectURL(href), 1000)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed. Try PNG.")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="bg-up-navy text-up-cream">
        <nav className="mx-auto max-w-6xl px-4 sm:px-10 pt-6 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-bold text-[16px]">Free QR Code Generator</span>
          <span className="rounded-full px-3 py-1.5 text-[13px] font-semibold border" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(251,250,247,0.65)" }}>
            by <span className="text-up-cream">{BRAND}</span>
          </span>
        </nav>
        <div className="mx-auto max-w-6xl px-4 sm:px-10 pt-10 pb-16 sm:pt-16 sm:pb-24">
          <Eyebrow className="text-up-orange mb-4">Free · No sign-up · No watermark</Eyebrow>
          <h1 className="font-display font-bold text-[32px] leading-[1.15] sm:text-[54px] sm:leading-[1.1] max-w-3xl">
            QR codes people actually want to scan.
          </h1>
          <p className="mt-5 text-[18px] leading-[1.6] max-w-2xl" style={{ color: "rgba(251,250,247,0.65)" }}>
            Pick a pattern, shape the corners, add your colors and logo. Every design is checked so phones can still read it.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-10 py-10 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
          {/* Controls */}
          <div className="space-y-6 min-w-0">
            <section className={cardClass}>
              <Eyebrow className="text-up-orange-ink mb-1">Step 1</Eyebrow>
              <h2 className="font-display font-bold text-[19px] leading-[1.3] mb-4">What should it open?</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url" className="text-[14px] font-medium">
                    Link or text
                  </Label>
                  <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="mt-2 h-11 rounded-full px-4 text-[15px]" />
                </div>
                <div>
                  <Label htmlFor="caption" className="text-[14px] font-medium">
                    Label under the code <span className="text-up-muted font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Scan me"
                    maxLength={28}
                    className="mt-2 h-11 rounded-full px-4 text-[15px]"
                  />
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <Eyebrow className="text-up-orange-ink mb-1">Step 2</Eyebrow>
              <h2 className="font-display font-bold text-[19px] leading-[1.3] mb-4">Make it yours</h2>

              <Tabs defaultValue="designs" className="w-full gap-5">
                <TabsList className="w-full h-auto grid grid-cols-5 rounded-full p-1 bg-up-cream border border-up-border">
                  {["designs", "pattern", "corners", "colors", "logo"].map((t) => (
                    <TabsTrigger
                      key={t}
                      value={t}
                      className="capitalize rounded-full py-1.5 text-[13px] sm:text-[14px] font-semibold text-up-muted data-[state=active]:bg-up-navy data-[state=active]:text-up-cream data-[state=active]:shadow-none"
                    >
                      {t}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="designs">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {QR_PRESETS.map((p) => (
                      <Tile key={p.id} selected={activePreset === p.id} onClick={() => setDesign(p.design)} label={p.label}>
                        <QRCodeGenerator value={url} size={120} design={p.design} style={{ width: "100%" }} />
                      </Tile>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="pattern">
                  <div className="grid grid-cols-4 gap-2.5">
                    {QR_SHAPES.map((s) => (
                      <Tile key={s.id} selected={s.id === design.shape} onClick={() => update({ shape: s.id })} label={s.label}>
                        {/* Zoomed-in corner of the real code, so each tile previews the actual pattern */}
                        <span className="block w-full aspect-square overflow-hidden rounded-[12px]">
                          <QRCodeGenerator value={url} size={170} design={{ ...design, shape: s.id }} style={{ maxWidth: "none" }} />
                        </span>
                      </Tile>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="corners" className="space-y-5">
                  <div>
                    <FieldLabel>Corner frame</FieldLabel>
                    <ShapeChips options={EYE_FRAMES} value={design.eyeFrame} onChange={(v) => update({ eyeFrame: v })} frame />
                  </div>
                  <div>
                    <FieldLabel>Corner center</FieldLabel>
                    <ShapeChips options={EYE_BALLS} value={design.eyeBall} onChange={(v) => update({ eyeBall: v })} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ColorField label="Frame color" value={design.eyeFrameColor} onChange={(v) => update({ eyeFrameColor: v })} />
                    <ColorField label="Center color" value={design.eyeBallColor} onChange={(v) => update({ eyeBallColor: v })} />
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ColorField label="Background" value={design.background} onChange={(v) => update({ background: v })} />
                    <ColorField label="Pattern" value={design.moduleColor} onChange={(v) => update({ moduleColor: v })} />
                  </div>
                  <SwitchRow
                    id="gradient"
                    label="Gradient pattern"
                    checked={design.gradientColor !== null}
                    onChange={(v) => update({ gradientColor: v ? design.eyeBallColor === design.moduleColor ? UP.orangeInk : design.eyeBallColor : null })}
                  />
                  {design.gradientColor !== null && (
                    <ColorField label="Gradient ends in" value={design.gradientColor} onChange={(v) => update({ gradientColor: v })} />
                  )}
                  <SwitchRow id="rounded-card" label="Rounded background" checked={design.roundedCard} onChange={(v) => update({ roundedCard: v })} />
                </TabsContent>

                <TabsContent value="logo" className="space-y-5">
                  <div>
                    <FieldLabel>Logo in the middle</FieldLabel>
                    <ImageUpload onImageUpload={setLogoImage} />
                  </div>
                  {logoImage && (
                    <>
                      <div>
                        <FieldLabel>Logo size: {logoScale[0]}% of the code</FieldLabel>
                        <Slider value={logoScale} onValueChange={setLogoScale} min={10} max={30} step={1} />
                        <p className="text-[13px] text-up-muted mt-2">Above 25% some phones start to struggle.</p>
                      </div>
                      <div>
                        <FieldLabel>Shape</FieldLabel>
                        <ShapeChips options={LOGO_SHAPES} value={logoStyle.shape} onChange={(v) => updateLogo({ shape: v })} />
                      </div>
                      <div>
                        <FieldLabel>Fit</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              ["contain", "Show whole image"],
                              ["cover", "Fill and crop"],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => updateLogo({ fit: id })}
                              aria-pressed={logoStyle.fit === id}
                              className={`px-3.5 py-2 rounded-full border text-[14px] font-semibold transition-colors ${
                                logoStyle.fit === id ? "bg-up-navy text-up-cream border-up-navy" : "border-up-border hover:border-up-navy"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Padding: {Math.round(logoStyle.padding * 100)}%</FieldLabel>
                        <Slider
                          value={[Math.round(logoStyle.padding * 100)]}
                          onValueChange={([v]) => updateLogo({ padding: v / 100 })}
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <SwitchRow
                        id="remove-white"
                        label="Remove white background from logo"
                        checked={logoStyle.removeWhite}
                        onChange={(v) => updateLogo({ removeWhite: v })}
                      />
                      <SwitchRow
                        id="badge"
                        label="Colored badge behind logo"
                        checked={logoStyle.badgeColor !== null}
                        onChange={(v) => updateLogo({ badgeColor: v ? UP.white : null })}
                      />
                      {logoStyle.badgeColor !== null && (
                        <ColorField label="Badge color" value={logoStyle.badgeColor} onChange={(v) => updateLogo({ badgeColor: v })} />
                      )}
                      <SwitchRow id="ring" label="Ring around logo" checked={logoStyle.ring} onChange={(v) => updateLogo({ ring: v })} />
                      {logoStyle.ring && (
                        <ColorField
                          label="Ring color"
                          value={logoStyle.ringColor ?? design.eyeFrameColor}
                          onChange={(v) => updateLogo({ ringColor: v })}
                        />
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* Preview */}
          <aside className={`${cardClass} order-first lg:order-none lg:sticky lg:top-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-[19px] leading-[1.3]">Preview</h2>
              <button
                type="button"
                onClick={() => setDesign(DEFAULT_DESIGN)}
                className="flex items-center gap-1.5 text-[14px] font-semibold text-up-orange-ink hover:underline"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="flex justify-center rounded-[18px] bg-up-cream border border-up-border p-6">
              <QRCodeGenerator
                value={url}
                size={300}
                design={design}
                logoImage={logoImage}
                logoScale={logoScale[0] / 100}
                logoStyle={logoStyle}
                caption={caption}
              />
            </div>

            {warnings.length > 0 && (
              <ul className="mt-4 space-y-2" aria-live="polite">
                {warnings.map((w) => (
                  <li key={w} className="flex gap-2 rounded-[14px] p-3 text-[14px] leading-[1.5]" style={{ backgroundColor: "rgba(255,106,0,0.12)" }}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-up-orange-ink" />
                    {w}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Format</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {EXPORT_FORMATS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      aria-pressed={format === f.id}
                      title={f.note}
                      className={`py-2 rounded-full border text-[14px] font-semibold transition-colors ${
                        format === f.id ? "bg-up-navy text-up-cream border-up-navy" : "border-up-border hover:border-up-navy"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-[13px] text-up-muted mt-2">{EXPORT_FORMATS.find((f) => f.id === format)!.note}</p>
              </div>

              <SwitchRow
                id="transparent"
                label={format === "jpg" ? "Transparent background (not in JPG)" : "Transparent background"}
                checked={transparent && format !== "jpg"}
                onChange={setTransparent}
                disabled={format === "jpg"}
              />

              {format !== "svg" && (
                <div>
                  <FieldLabel>Download size</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {DOWNLOAD_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDownloadSize(s)}
                        aria-pressed={downloadSize === s}
                        className={`py-2 rounded-full border text-[14px] font-semibold transition-colors ${
                          downloadSize === s ? "bg-up-navy text-up-cream border-up-navy" : "border-up-border hover:border-up-navy"
                        }`}
                      >
                        {s}px
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-full bg-up-orange text-up-navy text-[16px] leading-none font-bold hover:brightness-105 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up-navy focus-visible:ring-offset-2"
              >
                <Download className="w-5 h-5" />
                Download {EXPORT_FORMATS.find((f) => f.id === format)!.label}
              </button>
              {downloadError && <p className="text-[14px] text-destructive">{downloadError}</p>}
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-up-navy">
        <div className="mx-auto max-w-6xl px-4 sm:px-10 py-8 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <p className="font-semibold text-up-cream">
            An <span className="text-up-orange">{BRAND}</span> product
          </p>
          <p style={{ color: "rgba(251,250,247,0.4)" }}>
            Free QR Code Generator · Codes never expire and are made in your browser. © {new Date().getFullYear()} {BRAND}
          </p>
        </div>
      </footer>
    </div>
  )
}
