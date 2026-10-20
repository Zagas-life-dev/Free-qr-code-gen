"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

// UP palette first, then a few neutrals and extras
const presetColors = [
  "#0B1233",
  "#FBFAF7",
  "#FF6A00",
  "#B8551E",
  "#FF4D6D",
  "#D6FF3F",
  "#000000",
  "#FFFFFF",
  "#5B5847",
  "#1E3A8A",
  "#047857",
  "#7C3AED",
]

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-12 h-10 p-0 border-2 bg-transparent"
            style={{ backgroundColor: color }}
          >
            <span className="sr-only">Pick color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Custom Color</label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-12 h-10 p-1 border-2"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Preset Colors</label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {presetColors.map((presetColor) => (
                  <Button
                    key={presetColor}
                    variant="outline"
                    className="w-8 h-8 p-0 border-2 bg-transparent"
                    style={{ backgroundColor: presetColor }}
                    onClick={() => {
                      onChange(presetColor)
                      setIsOpen(false)
                    }}
                  >
                    <span className="sr-only">Select {presetColor}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
        placeholder="#000000"
      />
    </div>
  )
}
