import QRCode from "qrcode"

// Colors from the UP design system (tokens.json)
export const UP = {
  cream: "#FBFAF7",
  white: "#FFFFFF",
  navy: "#0B1233",
  orange: "#FF6A00",
  orangeInk: "#B8551E",
  lime: "#D6FF3F",
  coral: "#FF4D6D",
  black: "#000000",
}

export type QRShapeId = "dots" | "lines" | "bars" | "liquid" | "network" | "sparkle" | "rounded" | "square"
export type EyeFrameId = "square" | "rounded" | "circle" | "leaf" | "cut"
export type EyeBallId = "square" | "rounded" | "circle" | "leaf" | "diamond" | "star"

export const QR_SHAPES: { id: QRShapeId; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "dots", label: "Dots" },
  { id: "rounded", label: "Rounded" },
  { id: "lines", label: "Lines" },
  { id: "bars", label: "Bars" },
  { id: "liquid", label: "Liquid" },
  { id: "network", label: "Network" },
  { id: "sparkle", label: "Sparkle" },
]

export const EYE_FRAMES: { id: EyeFrameId; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "leaf", label: "Leaf" },
  { id: "cut", label: "Cut" },
]

export const EYE_BALLS: { id: EyeBallId; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "leaf", label: "Leaf" },
  { id: "diamond", label: "Diamond" },
  { id: "star", label: "Star" },
]

// Everything that describes how a code looks (colors are hex strings)
export interface QRDesign {
  shape: QRShapeId
  eyeFrame: EyeFrameId
  eyeBall: EyeBallId
  background: string
  moduleColor: string
  eyeFrameColor: string
  eyeBallColor: string
  // When set, the pattern blends from moduleColor (top-left) to this color (bottom-right)
  gradientColor: string | null
  roundedCard: boolean
}

export const CLASSIC_DESIGN: QRDesign = {
  shape: "square",
  eyeFrame: "square",
  eyeBall: "square",
  background: UP.white,
  moduleColor: UP.black,
  eyeFrameColor: UP.black,
  eyeBallColor: UP.black,
  gradientColor: null,
  roundedCard: false,
}

const up = (d: Partial<QRDesign>): QRDesign => ({ ...CLASSIC_DESIGN, roundedCard: true, ...d })

export const QR_PRESETS: { id: string; label: string; design: QRDesign }[] = [
  { id: "classic", label: "Classic", design: CLASSIC_DESIGN },
  {
    id: "up",
    label: "UP",
    design: up({ shape: "dots", eyeFrame: "circle", eyeBall: "circle", background: UP.navy, moduleColor: UP.orange, eyeFrameColor: UP.cream, eyeBallColor: UP.orange }),
  },
  {
    id: "sunset",
    label: "Sunset",
    design: up({ shape: "liquid", eyeFrame: "rounded", eyeBall: "circle", background: UP.navy, moduleColor: UP.orange, eyeFrameColor: UP.orange, eyeBallColor: UP.coral, gradientColor: UP.coral }),
  },
  {
    id: "neon",
    label: "Neon",
    design: up({ shape: "lines", eyeFrame: "leaf", eyeBall: "diamond", background: UP.navy, moduleColor: UP.lime, eyeFrameColor: UP.lime, eyeBallColor: UP.orange, gradientColor: UP.orange }),
  },
  {
    id: "paper",
    label: "Paper",
    design: up({ shape: "rounded", eyeFrame: "cut", eyeBall: "star", background: UP.cream, moduleColor: UP.navy, eyeFrameColor: UP.navy, eyeBallColor: UP.orangeInk }),
  },
  {
    id: "ember",
    label: "Ember",
    design: up({ shape: "network", eyeFrame: "circle", eyeBall: "circle", background: UP.cream, moduleColor: UP.navy, eyeFrameColor: UP.orangeInk, eyeBallColor: UP.orangeInk, gradientColor: UP.orangeInk }),
  },
  {
    id: "zest",
    label: "Zest",
    design: up({ shape: "sparkle", eyeFrame: "leaf", eyeBall: "leaf", background: UP.lime, moduleColor: UP.navy, eyeFrameColor: UP.navy, eyeBallColor: UP.orangeInk, gradientColor: UP.orangeInk }),
  },
  {
    id: "pop",
    label: "Pop",
    design: up({ shape: "bars", eyeFrame: "circle", eyeBall: "diamond", background: UP.coral, moduleColor: UP.navy, eyeFrameColor: UP.navy, eyeBallColor: UP.navy }),
  },
  {
    id: "blaze",
    label: "Blaze",
    design: up({ shape: "liquid", eyeFrame: "leaf", eyeBall: "star", background: UP.orange, moduleColor: UP.navy, eyeFrameColor: UP.navy, eyeBallColor: UP.navy }),
  },
]

/* ---------- Scannability checks ---------- */

function luminance(hexColor: string) {
  const h = hexColor.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6)
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return 0
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export const isHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)

const MIN_CONTRAST = 3

// Plain-language problems that could stop phones from scanning this design
export function scanWarnings(d: QRDesign): string[] {
  const warnings: string[] = []
  const parts: [string, string | null][] = [
    ["Pattern color", d.moduleColor],
    ["Gradient color", d.gradientColor],
    ["Corner frame color", d.eyeFrameColor],
    ["Corner center color", d.eyeBallColor],
  ]
  for (const [label, color] of parts) {
    if (color && contrast(color, d.background) < MIN_CONTRAST) {
      warnings.push(`${label} is too close to the background. Pick a darker or lighter shade.`)
    }
  }
  const lightMarks = luminance(d.moduleColor) > luminance(d.background)
  if (lightMarks && warnings.length === 0) {
    warnings.push("Light pattern on a dark background works on most phones, but some older scanner apps can't read it.")
  }
  const darkFlags = [d.eyeFrameColor, d.eyeBallColor].map((c) => luminance(c) > luminance(d.background))
  if (darkFlags.some((f) => f !== lightMarks)) {
    warnings.push("Corners and pattern should both be darker (or both lighter) than the background.")
  }
  return warnings
}

/* ---------- Shape paths (shared by canvas and SVG icons) ---------- */

type Corner = "tl" | "tr" | "br" | "bl"

function cornerRect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: number[]) {
  return (
    `M${x + tl},${y}H${x + w - tr}A${tr},${tr} 0 0 1 ${x + w},${y + tr}` +
    `V${y + h - br}A${br},${br} 0 0 1 ${x + w - br},${y + h}` +
    `H${x + bl}A${bl},${bl} 0 0 1 ${x},${y + h - bl}` +
    `V${y + tl}A${tl},${tl} 0 0 1 ${x + tl},${y}Z`
  )
}

// SVG path for a corner frame or center shape filling the square (x, y, s).
// `sharp` names the corner that points toward the middle of the code (used by leaf).
export function shapePath(kind: EyeFrameId | EyeBallId, x: number, y: number, s: number, sharp: Corner = "br") {
  const mx = x + s / 2
  const my = y + s / 2
  switch (kind) {
    case "rounded":
      return cornerRect(x, y, s, s, [s * 0.3, s * 0.3, s * 0.3, s * 0.3])
    case "circle":
      return cornerRect(x, y, s, s, [s / 2, s / 2, s / 2, s / 2])
    case "leaf": {
      const order: Corner[] = ["tl", "tr", "br", "bl"]
      return cornerRect(x, y, s, s, order.map((c) => (c === sharp ? s * 0.08 : s / 2)))
    }
    case "cut": {
      const c = s * 0.28
      return `M${x + c},${y}H${x + s - c}L${x + s},${y + c}V${y + s - c}L${x + s - c},${y + s}H${x + c}L${x},${y + s - c}V${y + c}Z`
    }
    case "diamond": {
      const h = s * 0.64
      return `M${mx},${my - h}L${mx + h},${my}L${mx},${my + h}L${mx - h},${my}Z`
    }
    case "star": {
      const h = s * 0.64
      const p = s * 0.22
      return (
        `M${mx},${my - h}Q${mx + p},${my - p} ${mx + h},${my}Q${mx + p},${my + p} ${mx},${my + h}` +
        `Q${mx - p},${my + p} ${mx - h},${my}Q${mx - p},${my - p} ${mx},${my - h}Z`
      )
    }
    default:
      return `M${x},${y}H${x + s}V${y + s}H${x}Z`
  }
}

/* ---------- Logo formatting ---------- */

export type LogoShape = "circle" | "rounded" | "square"

export interface LogoStyle {
  shape: LogoShape
  // contain shows the whole image; cover fills the badge and crops the edges
  fit: "contain" | "cover"
  // Space between the badge edge and the image, as a share of the badge (0 to 0.25)
  padding: number
  // Badge fill; null shows the code background through
  badgeColor: string | null
  ring: boolean
  // null follows the corner frame color
  ringColor: string | null
  // Knocks out near-white pixels, for logos saved on a white box
  removeWhite: boolean
}

export const DEFAULT_LOGO_STYLE: LogoStyle = {
  shape: "circle",
  fit: "contain",
  padding: 0.1,
  badgeColor: null,
  ring: false,
  ringColor: null,
  removeWhite: false,
}

export const LOGO_SHAPES: { id: LogoShape; label: string }[] = [
  { id: "circle", label: "Circle" },
  { id: "rounded", label: "Rounded" },
  { id: "square", label: "Square" },
]

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      }),
    )
  }
  return imageCache.get(src)!
}

const whiteCache = new Map<string, Promise<string>>()

// Returns a PNG data URL of the image with near-white pixels made transparent (soft edge)
function removeWhite(src: string): Promise<string> {
  if (!whiteCache.has(src)) {
    whiteCache.set(
      src,
      loadImage(src).then((img) => {
        if (!img) return src
        const w = img.naturalWidth || 512
        const h = img.naturalHeight || 512
        const c = document.createElement("canvas")
        c.width = w
        c.height = h
        const ctx = c.getContext("2d")!
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h)
        const px = data.data
        for (let i = 0; i < px.length; i += 4) {
          const min = Math.min(px[i], px[i + 1], px[i + 2])
          if (min >= 240) px[i + 3] = 0
          else if (min > 215) px[i + 3] = Math.round(px[i + 3] * ((240 - min) / 25))
        }
        ctx.putImageData(data, 0, 0)
        return c.toDataURL("image/png")
      }),
    )
  }
  return whiteCache.get(src)!
}

/* ---------- Scene: the code as plain shapes, drawn to canvas or SVG ---------- */

type Paint = string | { x1: number; y1: number; x2: number; y2: number; from: string; to: string }

interface Layer {
  d: string
  fill?: Paint
  stroke?: { paint: Paint; width: number }
  evenodd?: boolean
}

interface Scene {
  width: number
  height: number
  layers: Layer[]
  logo: { href: string; img: HTMLImageElement; clip: string | null; x: number; y: number; w: number; h: number } | null
  caption: { text: string; x: number; y: number; size: number; color: string; maxWidth: number } | null
}

export interface RenderQROptions {
  value: string
  size: number
  design: QRDesign
  logoSrc?: string | null
  // Badge width as a share of the code's width (0.1 to 0.3)
  logoScale?: number
  logoStyle?: LogoStyle
  caption?: string
  // Leaves the background empty (PNG/WebP/SVG downloads)
  transparent?: boolean
  // Bitmap scale on top of `size`; previews use devicePixelRatio, downloads use 1
  pixelRatio?: number
}

const QUIET_ZONE = 3 // modules of padding, so downloads scan on their own

// Rounds long decimals so SVG output stays small
const tidy = (d: string) => d.replace(/-?\d+\.\d{3,}/g, (n) => String(Math.round(parseFloat(n) * 100) / 100))

const rectD = (x: number, y: number, w: number, h: number, r = 0) => {
  const radius = Math.min(r, w / 2, h / 2)
  return radius > 0 ? cornerRect(x, y, w, h, [radius, radius, radius, radius]) : `M${x},${y}H${x + w}V${y + h}H${x}Z`
}

// Clockwise like rectD, so overlapping shapes in one nonzero-filled path merge instead of cancelling
const circleD = (cx: number, cy: number, r: number) => `M${cx - r},${cy}a${r},${r} 0 1 1 ${r * 2},0a${r},${r} 0 1 1 ${-r * 2},0Z`

const logoShapeD = (shape: LogoShape, cx: number, cy: number, s: number) =>
  shape === "circle" ? circleD(cx, cy, s / 2) : rectD(cx - s / 2, cy - s / 2, s, s, shape === "rounded" ? s * 0.25 : 0)

type ModuleTest = (r: number, c: number) => boolean

// Builds the data-module layer(s) for the chosen pattern
function moduleLayers(shape: QRShapeId, count: number, cell: number, offset: number, on: ModuleTest, paint: Paint): Layer[] {
  const x = (c: number) => offset + c * cell
  const y = (r: number) => offset + r * cell
  const cx = (c: number) => x(c) + cell / 2
  const cy = (r: number) => y(r) + cell / 2
  const parts: string[] = []
  const each = (fn: (r: number, c: number) => void) => {
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (on(r, c)) fn(r, c)
  }

  // Joins each horizontal (or vertical) run of modules into one pill-shaped stroke
  const runs = (vertical: boolean) => {
    const inset = cell * 0.1
    const thick = cell - inset * 2
    for (let a = 0; a < count; a++) {
      let b = 0
      while (b < count) {
        const isOn = (i: number) => (vertical ? on(i, a) : on(a, i))
        if (!isOn(b)) {
          b++
          continue
        }
        const start = b
        while (b < count && isOn(b)) b++
        const len = (b - start) * cell - inset * 2
        parts.push(
          vertical
            ? rectD(x(a) + inset, y(start) + inset, thick, len, thick / 2)
            : rectD(x(start) + inset, y(a) + inset, len, thick, thick / 2),
        )
      }
    }
  }

  switch (shape) {
    case "lines":
      runs(false)
      break
    case "bars":
      runs(true)
      break
    case "liquid":
      // Full-size discs bridged to their neighbors so clusters melt together
      each((r, c) => {
        parts.push(circleD(cx(c), cy(r), cell / 2))
        if (on(r, c + 1)) parts.push(rectD(cx(c), y(r), cell, cell))
        if (on(r + 1, c)) parts.push(rectD(x(c), cy(r), cell, cell))
        if (on(r, c + 1) && on(r + 1, c) && on(r + 1, c + 1)) parts.push(rectD(cx(c), cy(r), cell, cell))
      })
      break
    case "network": {
      // Nodes joined to right and lower neighbors; thick enough to read as dark to scanners
      const links: string[] = []
      each((r, c) => {
        if (on(r, c + 1)) links.push(`M${cx(c)},${cy(r)}H${cx(c + 1)}`)
        if (on(r + 1, c)) links.push(`M${cx(c)},${cy(r)}V${cy(r + 1)}`)
        parts.push(circleD(cx(c), cy(r), cell * 0.42))
      })
      return [
        { d: tidy(links.join("")), stroke: { paint, width: cell * 0.5 } },
        { d: tidy(parts.join("")), fill: paint },
      ]
    }
    case "sparkle":
      each((r, c) => parts.push(shapePath("star", x(c), y(r), cell * 1.05)))
      break
    case "dots":
      each((r, c) => parts.push(circleD(cx(c), cy(r), cell * 0.42)))
      break
    case "rounded":
      each((r, c) => parts.push(rectD(x(c) + cell * 0.06, y(r) + cell * 0.06, cell * 0.88, cell * 0.88, cell * 0.32)))
      break
    default:
      // Slight overlap hides hairline seams between neighboring squares
      each((r, c) => parts.push(rectD(x(c), y(r), cell + 0.3, cell + 0.3)))
  }
  return [{ d: tidy(parts.join("")), fill: paint }]
}

// Height the caption strip adds below the code, as a share of the QR size
export function captionHeight(size: number, caption?: string) {
  return caption ? Math.round(size * 0.16) : 0
}

async function buildScene(opts: RenderQROptions): Promise<Scene> {
  const { size, design, logoSrc, logoScale = 0.22, transparent } = opts
  const ls = opts.logoStyle ?? DEFAULT_LOGO_STYLE
  const caption = opts.caption?.trim()
  const qr = QRCode.create(opts.value || " ", { errorCorrectionLevel: "H" })
  const modules = qr.modules
  const count = modules.size
  const cell = size / (count + QUIET_ZONE * 2)
  const offset = QUIET_ZONE * cell
  const span = count * cell
  const extra = captionHeight(size, caption)
  const layers: Layer[] = []

  if (!transparent) {
    layers.push({ d: rectD(0, 0, size, size + extra, design.roundedCard ? size * 0.07 : 0), fill: design.background })
  }

  // Logo badge: modules inside it are skipped (error correction H covers up to ~30% loss)
  const img = logoSrc ? await loadImage(ls.removeWhite ? await removeWhite(logoSrc) : logoSrc) : null
  const center = offset + span / 2
  // Square and rounded badges are shrunk to the circle's area, so a given size hides the same share of the code
  const areaMatch = ls.shape === "circle" ? 1 : Math.sqrt(Math.PI / 4)
  const badge = img ? (span * Math.min(Math.max(logoScale, 0.1), 0.3) + cell * 1.2) * areaMatch : 0
  const inBadge = (px: number, py: number) => {
    const dx = Math.abs(px - center)
    const dy = Math.abs(py - center)
    const reach = badge / 2 + cell * 0.5
    return ls.shape === "circle" ? Math.hypot(dx, dy) < reach : Math.max(dx, dy) < reach
  }

  const isEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7)
  const on = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= count || c >= count) return false
    if (!modules.get(r, c) || isEye(r, c)) return false
    return !(img && inBadge(offset + (c + 0.5) * cell, offset + (r + 0.5) * cell))
  }

  const paint: Paint = design.gradientColor
    ? { x1: offset, y1: offset, x2: offset + span, y2: offset + span, from: design.moduleColor, to: design.gradientColor }
    : design.moduleColor
  layers.push(...moduleLayers(design.shape, count, cell, offset, on, paint))

  // Finder patterns ("eyes"): frame drawn with an even-odd hole, then the center
  const eyes: [number, number, "br" | "bl" | "tr"][] = [
    [0, 0, "br"],
    [0, count - 7, "bl"],
    [count - 7, 0, "tr"],
  ]
  for (const [r, c, sharp] of eyes) {
    const x = offset + c * cell
    const y = offset + r * cell
    layers.push({
      d: tidy(shapePath(design.eyeFrame, x, y, cell * 7, sharp) + shapePath(design.eyeFrame, x + cell, y + cell, cell * 5, sharp)),
      fill: design.eyeFrameColor,
      evenodd: true,
    })
    layers.push({ d: tidy(shapePath(design.eyeBall, x + cell * 2, y + cell * 2, cell * 3, sharp)), fill: design.eyeBallColor })
  }

  let logo: Scene["logo"] = null
  if (img) {
    if (ls.badgeColor) layers.push({ d: tidy(logoShapeD(ls.shape, center, center, badge)), fill: ls.badgeColor })
    // Kept well under a module wide: a module-thick dark ring reads as a fake finder pattern to scanners
    const ringWidth = cell * 0.2
    if (ls.ring) {
      layers.push({
        d: tidy(logoShapeD(ls.shape, center, center, badge - ringWidth)),
        stroke: { paint: ls.ringColor ?? design.eyeFrameColor, width: ringWidth },
      })
    }
    const inner = (badge - (ls.ring ? ringWidth * 2 : 0)) * (1 - Math.min(Math.max(ls.padding, 0), 0.25) * 2)
    const iw = img.naturalWidth || 1
    const ih = img.naturalHeight || 1
    const scale = ls.fit === "cover" ? Math.max(inner / iw, inner / ih) : Math.min(inner / iw, inner / ih)
    const w = iw * scale
    const h = ih * scale
    logo = {
      href: img.src,
      img,
      // Cover always clips; contain only needs the clip for rounded/circle badges
      clip: ls.fit === "cover" || ls.shape !== "square" ? tidy(logoShapeD(ls.shape, center, center, inner)) : null,
      x: center - w / 2,
      y: center - h / 2,
      w,
      h,
    }
  }

  return {
    width: size,
    height: size + extra,
    layers,
    logo,
    // Pattern color is the one the scan check already guarantees contrasts with the background
    caption: caption
      ? { text: caption.toUpperCase(), x: size / 2, y: size + extra / 2 - cell, size: Math.round(size * 0.055), color: design.moduleColor, maxWidth: size - cell * 4 }
      : null,
  }
}

function canvasPaint(ctx: CanvasRenderingContext2D, p: Paint) {
  if (typeof p === "string") return p
  const g = ctx.createLinearGradient(p.x1, p.y1, p.x2, p.y2)
  g.addColorStop(0, p.from)
  g.addColorStop(1, p.to)
  return g
}

export async function renderStyledQR(canvas: HTMLCanvasElement, opts: RenderQROptions) {
  const scene = await buildScene(opts)
  const pixelRatio = opts.pixelRatio ?? 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  canvas.width = Math.round(scene.width * pixelRatio)
  canvas.height = Math.round(scene.height * pixelRatio)
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, scene.width, scene.height)

  for (const layer of scene.layers) {
    const path = new Path2D(layer.d)
    if (layer.fill) {
      ctx.fillStyle = canvasPaint(ctx, layer.fill)
      ctx.fill(path, layer.evenodd ? "evenodd" : "nonzero")
    }
    if (layer.stroke) {
      ctx.strokeStyle = canvasPaint(ctx, layer.stroke.paint)
      ctx.lineWidth = layer.stroke.width
      ctx.lineCap = "round"
      ctx.stroke(path)
    }
  }

  if (scene.logo) {
    const { img, clip, x, y, w, h } = scene.logo
    ctx.save()
    if (clip) ctx.clip(new Path2D(clip))
    ctx.drawImage(img, x, y, w, h)
    ctx.restore()
  }

  if (scene.caption) {
    const cap = scene.caption
    // next/font renames families, so read the real name from the CSS variable it sets
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-unbounded").trim() || "Unbounded, sans-serif"
    const font = `700 ${cap.size}px ${family}`
    try {
      await document.fonts.load(font)
    } catch {
      // fall back to sans-serif
    }
    ctx.fillStyle = cap.color
    ctx.font = font
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(cap.text, cap.x, cap.y, cap.maxWidth)
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// Vector version of the same design, for print and design tools
export async function renderStyledQRSvg(opts: RenderQROptions): Promise<string> {
  const scene = await buildScene(opts)
  const defs: string[] = []
  const body: string[] = []
  const svgPaint = (p: Paint) => {
    if (typeof p === "string") return p
    const id = `g${defs.length}`
    defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}">` +
        `<stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient>`,
    )
    return `url(#${id})`
  }

  for (const layer of scene.layers) {
    const attrs = [`d="${layer.d}"`]
    attrs.push(layer.fill ? `fill="${svgPaint(layer.fill)}"` : `fill="none"`)
    if (layer.evenodd) attrs.push(`fill-rule="evenodd"`)
    if (layer.stroke) attrs.push(`stroke="${svgPaint(layer.stroke.paint)}" stroke-width="${layer.stroke.width}" stroke-linecap="round"`)
    body.push(`<path ${attrs.join(" ")}/>`)
  }

  if (scene.logo) {
    const { href, clip, x, y, w, h } = scene.logo
    if (clip) defs.push(`<clipPath id="logo-clip"><path d="${clip}"/></clipPath>`)
    body.push(
      `<image href="${esc(href)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${clip ? ` clip-path="url(#logo-clip)"` : ""}/>`,
    )
  }

  let style = ""
  if (scene.caption) {
    const cap = scene.caption
    // Browsers fetch the font; design tools without it fall back to a bold sans-serif
    style = `<style>@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700&amp;display=swap');</style>`
    body.push(
      `<text x="${cap.x}" y="${cap.y}" fill="${cap.color}" font-family="Unbounded, sans-serif" font-weight="700" font-size="${cap.size}" ` +
        `text-anchor="middle" dominant-baseline="middle">${esc(cap.text)}</text>`,
    )
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">` +
    style +
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    body.join("") +
    `</svg>`
  )
}

/* ---------- Downloads ---------- */

export type ExportFormat = "png" | "jpg" | "webp" | "svg"

export const EXPORT_FORMATS: { id: ExportFormat; label: string; note: string }[] = [
  { id: "png", label: "PNG", note: "Best for most uses" },
  { id: "jpg", label: "JPG", note: "Smallest file, no transparency" },
  { id: "webp", label: "WebP", note: "Small file for websites" },
  { id: "svg", label: "SVG", note: "Vector: sharp at any print size" },
]

export async function exportQR(format: ExportFormat, opts: RenderQROptions): Promise<Blob> {
  if (format === "svg") {
    return new Blob([await renderStyledQRSvg(opts)], { type: "image/svg+xml" })
  }
  // JPG has no transparency, so it always gets a solid background
  const canvas = document.createElement("canvas")
  await renderStyledQR(canvas, { ...opts, transparent: format === "jpg" ? false : opts.transparent, pixelRatio: 1 })
  let source = canvas
  if (format === "jpg") {
    // Fill the rounded corners white instead of letting them turn black
    source = document.createElement("canvas")
    source.width = canvas.width
    source.height = canvas.height
    const ctx = source.getContext("2d")!
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, source.width, source.height)
    ctx.drawImage(canvas, 0, 0)
  }
  const type = format === "jpg" ? "image/jpeg" : `image/${format}`
  return new Promise((resolve, reject) =>
    source.toBlob((b) => (b ? resolve(b) : reject(new Error(`This browser can't export ${format.toUpperCase()}`))), type, 0.92),
  )
}
