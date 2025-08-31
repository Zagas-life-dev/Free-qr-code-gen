"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { ColorPicker } from "@/components/color-picker"
import { ImageUpload } from "@/components/image-upload"
import { QrCode, Palette, ImageIcon, Download } from "lucide-react"

export default function QRCodeGeneratorPage() {
  const [url, setUrl] = useState("https://example.com")
  const [foregroundColor, setForegroundColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [size, setSize] = useState([256])
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [logoSize, setLogoSize] = useState([60])
  const [cornerStyle, setCornerStyle] = useState<"square" | "rounded" | "circle">("square")
  const [patternStyle, setPatternStyle] = useState<"square" | "dots" | "rounded" | "diamond">("square")
  const [patternSize, setPatternSize] = useState([1.0])
  const qrRef = useRef<HTMLCanvasElement>(null)

  const handleDownload = useCallback(() => {
    if (qrRef.current) {
      const link = document.createElement("a")
      link.download = "qr-code.png"
      link.href = qrRef.current.toDataURL()
      link.click()
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <QrCode className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">Custom QR Code Generator</h1>
            <p className="text-xl text-muted-foreground text-pretty mb-8">
              Create beautiful, personalized QR codes with custom colors, designs, and embedded images. Perfect for
              branding, marketing, and creative projects.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Controls Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="url">Enter URL or Text</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="logo" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Logo
                </TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <Label>Foreground Color</Label>
                      <ColorPicker color={foregroundColor} onChange={setForegroundColor} className="mt-2" />
                    </div>
                    <div>
                      <Label>Background Color</Label>
                      <ColorPicker color={backgroundColor} onChange={setBackgroundColor} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logo" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <Label>Upload Logo</Label>
                      <ImageUpload onImageUpload={setLogoImage} className="mt-2" />
                    </div>
                    {logoImage && (
                      <div>
                        <Label>Logo Size: {logoSize[0]}px</Label>
                        <Slider
                          value={logoSize}
                          onValueChange={setLogoSize}
                          max={120}
                          min={20}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <Label>QR Code Size: {size[0]}px</Label>
                      <Slider value={size} onValueChange={setSize} max={512} min={128} step={32} className="mt-2" />
                    </div>
                    <div>
                      <Label>Corner Style</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {(["square", "rounded", "circle"] as const).map((style) => (
                          <Button
                            key={style}
                            variant={cornerStyle === style ? "default" : "outline"}
                            onClick={() => setCornerStyle(style)}
                            className="capitalize"
                          >
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Pattern Style</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {(["square", "dots", "rounded", "diamond"] as const).map((style) => (
                          <Button
                            key={style}
                            variant={patternStyle === style ? "default" : "outline"}
                            onClick={() => setPatternStyle(style)}
                            className="capitalize"
                          >
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Pattern Size: {Math.round(patternSize[0] * 100)}%</Label>
                      <Slider
                        value={patternSize}
                        onValueChange={setPatternSize}
                        max={1.0}
                        min={0.3}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  <div className="p-8 bg-muted/30 rounded-lg">
                    <QRCodeGenerator
                      ref={qrRef}
                      value={url}
                      size={size[0]}
                      fgColor={foregroundColor}
                      bgColor={backgroundColor}
                      logoImage={logoImage}
                      logoSize={logoSize[0]}
                      cornerStyle={cornerStyle}
                      patternStyle={patternStyle}
                      patternSize={patternSize[0]}
                    />
                  </div>
                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Presets */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForegroundColor("#000000")
                      setBackgroundColor("#ffffff")
                    }}
                  >
                    Classic
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForegroundColor("#059669")
                      setBackgroundColor("#f0fdf4")
                    }}
                  >
                    Emerald
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForegroundColor("#dc2626")
                      setBackgroundColor("#fef2f2")
                    }}
                  >
                    Red
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForegroundColor("#2563eb")
                      setBackgroundColor("#eff6ff")
                    }}
                  >
                    Blue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
