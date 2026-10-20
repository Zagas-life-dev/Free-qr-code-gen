"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { LogoStyle, QRDesign, renderStyledQR } from "@/lib/qr-styles"

interface QRCodeGeneratorProps {
  value: string
  size: number
  design: QRDesign
  logoImage?: string | null
  logoScale?: number
  logoStyle?: LogoStyle
  caption?: string
  className?: string
  style?: React.CSSProperties
}

// Live canvas preview of a styled QR code
export const QRCodeGenerator = forwardRef<HTMLCanvasElement, QRCodeGeneratorProps>(
  ({ value, size, design, logoImage, logoScale, logoStyle, caption, className, style }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useImperativeHandle(ref, () => canvasRef.current!, [])
    // Re-render only when a field actually changes, not on every new object
    const designKey = JSON.stringify(design)
    const logoKey = JSON.stringify(logoStyle ?? null)

    useEffect(() => {
      if (!canvasRef.current) return
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 3)
      renderStyledQR(canvasRef.current, { value, size, design, logoSrc: logoImage, logoScale, logoStyle, caption, pixelRatio }).catch(
        (error) => console.error("Error generating QR code:", error),
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, size, designKey, logoImage, logoScale, logoKey, caption])

    return <canvas ref={canvasRef} className={className} style={{ width: size, maxWidth: "100%", height: "auto", ...style }} />
  },
)

QRCodeGenerator.displayName = "QRCodeGenerator"
