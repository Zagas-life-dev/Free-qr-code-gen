"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string | null) => void
  className?: string
}

export function ImageUpload({ onImageUpload, className }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        onImageUpload(result)
      }
      reader.readAsDataURL(file)
    },
    [onImageUpload],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles],
  )

  const removeImage = useCallback(() => {
    setUploadedImage(null)
    onImageUpload(null)
  }, [onImageUpload])

  return (
    <div className={cn("w-full", className)}>
      {uploadedImage ? (
        <div className="relative">
          <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/30">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-background border">
              <img
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Logo uploaded</p>
              <p className="text-xs text-muted-foreground">Ready to embed in QR code</p>
            </div>
            <Button variant="ghost" size="sm" onClick={removeImage} className="text-destructive hover:text-destructive">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors",
            dragActive && "border-primary bg-primary/5",
            className,
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-muted rounded-full">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop your logo here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
