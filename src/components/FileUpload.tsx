'use client'

import { useState, useRef } from 'react'
import { PaperClipIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onRemove: () => void
  selectedFile: File | null
  maxSize?: number // in MB
  acceptedTypes?: string[]
}

export default function FileUpload({ 
  onFileSelect, 
  onRemove, 
  selectedFile, 
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', 'text/*']
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`)
      return
    }

    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })

    if (!isValidType) {
      alert('File type not supported')
      return
    }

    onFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-aqua-green" />
    }
    return <DocumentIcon className="h-5 w-5 text-neon-blue" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-3">
      {/* File Input */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragOver 
            ? 'border-electric-purple bg-electric-purple bg-opacity-10' 
            : 'border-light-gray hover:border-electric-purple'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <PaperClipIcon className="h-8 w-8 text-light-gray mx-auto mb-2" />
        <p className="text-sm text-light-gray mb-2">
          Drop files here or click to select
        </p>
        <p className="text-xs text-light-gray">
          Max size: {maxSize}MB • Supported: Images, PDF, Text
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept={acceptedTypes.join(',')}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg text-sm transition-colors"
        >
          Choose File
        </button>
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-midnight-blue rounded-lg">
          <div className="flex items-center space-x-3">
            {getFileIcon(selectedFile)}
            <div>
              <p className="text-sm font-medium text-soft-white truncate max-w-48">
                {selectedFile.name}
              </p>
              <p className="text-xs text-light-gray">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-1 text-light-gray hover:text-coral transition-colors"
            title="Remove file"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
