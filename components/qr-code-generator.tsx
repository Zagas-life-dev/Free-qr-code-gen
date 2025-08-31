"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import QRCode from "qrcode"

interface QRCodeGeneratorProps {
  value: string
  size?: number
  fgColor?: string
  bgColor?: string
  logoImage?: string | null
  logoSize?: number
  cornerStyle?: "square" | "rounded" | "circle"
  patternStyle?: "square" | "dots" | "rounded" | "diamond"
  patternSize?: number
}

export const QRCodeGenerator = forwardRef<HTMLCanvasElement, QRCodeGeneratorProps>(
  (
    {
      value,
      size = 256,
      fgColor = "#000000",
      bgColor = "#ffffff",
      logoImage,
      logoSize = 60,
      cornerStyle = "square",
      patternStyle = "square",
      patternSize = 1.0,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useImperativeHandle(ref, () => canvasRef.current!, [])

    const drawCustomPattern = (ctx: CanvasRenderingContext2D, qrData: any, moduleSize: number, margin: number) => {
      const modules = qrData.modules
      const size = modules.size

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (modules.get(x, y)) {
            const pixelX = margin + x * moduleSize
            const pixelY = margin + y * moduleSize

            ctx.fillStyle = fgColor

            const scaledSize = moduleSize * patternSize
            const offset = (moduleSize - scaledSize) / 2

            switch (patternStyle) {
              case "dots":
                const hasRightNeighbor = x < size - 1 && modules.get(x + 1, y)
                const hasBottomNeighbor = y < size - 1 && modules.get(x, y + 1)

                // Draw larger dots for isolated modules, smaller connected dots for groups
                const dotRadius =
                  hasRightNeighbor || hasBottomNeighbor
                    ? scaledSize * 0.45 // Larger for connected modules
                    : scaledSize * 0.4

                ctx.beginPath()
                ctx.arc(pixelX + moduleSize / 2, pixelY + moduleSize / 2, dotRadius, 0, 2 * Math.PI)
                ctx.fill()

                // Add connecting bridges for adjacent dots to maintain QR code readability
                if (hasRightNeighbor) {
                  ctx.fillRect(pixelX + moduleSize * 0.7, pixelY + moduleSize * 0.4, moduleSize * 0.3, moduleSize * 0.2)
                }
                if (hasBottomNeighbor) {
                  ctx.fillRect(pixelX + moduleSize * 0.4, pixelY + moduleSize * 0.7, moduleSize * 0.2, moduleSize * 0.3)
                }
                break

              case "rounded":
                ctx.beginPath()
                ctx.roundRect(pixelX + offset, pixelY + offset, scaledSize, scaledSize, scaledSize * 0.3)
                ctx.fill()
                break

              case "diamond":
                ctx.save()
                ctx.translate(pixelX + moduleSize / 2, pixelY + moduleSize / 2)
                ctx.rotate(Math.PI / 4)
                ctx.fillRect(-scaledSize * 0.35, -scaledSize * 0.35, scaledSize * 0.7, scaledSize * 0.7)
                ctx.restore()
                break

              default: // square
                ctx.fillRect(pixelX + offset, pixelY + offset, scaledSize, scaledSize)
                break
            }
          }
        }
      }
    }

    useEffect(() => {
      const generateQR = async () => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = size
        canvas.height = size

        try {
          const qrData = QRCode.create(value, {
            errorCorrectionLevel: logoImage ? "H" : "M",
          })

          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, size, size)

          const margin = Math.floor(size * 0.08)
          const availableSize = size - 2 * margin
          const moduleSize = availableSize / qrData.modules.size

          ctx.save()

          if (cornerStyle === "rounded") {
            const radius = size * 0.1
            ctx.beginPath()
            ctx.roundRect(0, 0, size, size, radius)
            ctx.clip()
          } else if (cornerStyle === "circle") {
            ctx.beginPath()
            ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
            ctx.clip()
          }

          drawCustomPattern(ctx, qrData, moduleSize, margin)

          ctx.restore()

          if (logoImage) {
            const logo = new Image()
            logo.crossOrigin = "anonymous"
            logo.onload = () => {
              const logoX = (size - logoSize) / 2
              const logoY = (size - logoSize) / 2

              ctx.save()
              ctx.fillStyle = bgColor

              const logoRadius = logoSize / 2 + 8
              ctx.beginPath()
              ctx.arc(size / 2, size / 2, logoRadius, 0, 2 * Math.PI)
              ctx.fill()

              ctx.strokeStyle = fgColor
              ctx.lineWidth = 2
              ctx.stroke()

              ctx.beginPath()
              ctx.arc(size / 2, size / 2, logoSize / 2, 0, 2 * Math.PI)
              ctx.clip()

              ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
              ctx.restore()
            }
            logo.src = logoImage
          }
        } catch (error) {
          console.error("Error generating QR code:", error)
        }
      }

      generateQR()
    }, [value, size, fgColor, bgColor, logoImage, logoSize, cornerStyle, patternStyle, patternSize])

    return (
      <canvas
        ref={canvasRef}
        className="border border-border rounded-lg shadow-sm"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    )
  },
)

QRCodeGenerator.displayName = "QRCodeGenerator"
