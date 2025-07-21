import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload as UploadIcon, 
  Image, 
  Video, 
  FileText, 
  X, 
  DollarSign,
  Share2,
  Copy,
  Check
} from 'lucide-react'
import { blink } from '@/blink/client'

interface UploadedFile {
  file: File
  type: 'image' | 'video' | 'text'
  preview?: string
}

export function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [textContent, setTextContent] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [generatedLink, setGeneratedLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'text'
      
      const uploadedFile: UploadedFile = {
        file,
        type: fileType
      }

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader()
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string
          setUploadedFiles(prev => [...prev, uploadedFile])
        }
        reader.readAsDataURL(file)
      } else {
        setUploadedFiles(prev => [...prev, uploadedFile])
      }
    })
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    
    // Simulate file input change
    const input = fileInputRef.current
    if (input) {
      const dt = new DataTransfer()
      files.forEach(file => dt.items.add(file))
      input.files = dt.files
      handleFileSelect({ target: input } as any)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addTextContent = () => {
    if (textContent.trim()) {
      const textFile = new File([textContent], 'text-content.txt', { type: 'text/plain' })
      setUploadedFiles(prev => [...prev, { file: textFile, type: 'text' }])
      setTextContent('')
    }
  }

  const handleUpload = async () => {
    if (!title || !price || (uploadedFiles.length === 0 && !textContent)) {
      alert('Please fill in all required fields and add content')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload files to storage
      const uploadedUrls: string[] = []
      
      for (const uploadedFile of uploadedFiles) {
        const { publicUrl } = await blink.storage.upload(
          uploadedFile.file,
          `content/${Date.now()}-${uploadedFile.file.name}`,
          { upsert: true }
        )
        uploadedUrls.push(publicUrl)
      }

      // Add text content if provided
      if (textContent.trim()) {
        const textFile = new File([textContent], 'content.txt', { type: 'text/plain' })
        const { publicUrl } = await blink.storage.upload(
          textFile,
          `content/${Date.now()}-text-content.txt`,
          { upsert: true }
        )
        uploadedUrls.push(publicUrl)
      }

      // Create content item in database
      const contentId = `content_${Date.now()}`
      const shareLink = `${window.location.origin}/view/${contentId}`
      
      await blink.db.contentItems.create({
        id: contentId,
        title,
        description,
        price: parseFloat(price),
        currency,
        contentUrls: uploadedUrls,
        shareLink,
        userId: (await blink.auth.me()).id,
        type: uploadedFiles[0]?.type || 'text',
        status: 'active',
        views: 0,
        earnings: 0,
        createdAt: new Date().toISOString()
      })

      setUploadProgress(100)
      setGeneratedLink(shareLink)
      
      // Generate QR code (placeholder - you'd use a real QR code service)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`)

      // Reset form
      setUploadedFiles([])
      setTextContent('')
      setTitle('')
      setDescription('')
      setPrice('')
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      case 'text': return <FileText className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Content</h1>
          <p className="mt-2 text-gray-600">
            Upload your photos, videos, or text content and set a price to start earning.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Upload</CardTitle>
                <CardDescription>
                  Drag and drop files or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to upload
                  </p>
                  <p className="text-sm text-gray-600">
                    Supports images, videos, and documents
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.txt,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-gray-900">Uploaded Files</h4>
                    {uploadedFiles.map((uploadedFile, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(uploadedFile.type)}
                          <div>
                            <p className="font-medium text-gray-900">{uploadedFile.file.name}</p>
                            <p className="text-sm text-gray-600">
                              {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{uploadedFile.type}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Content */}
            <Card>
              <CardHeader>
                <CardTitle>Text Content</CardTitle>
                <CardDescription>
                  Add text content directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write your content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={addTextContent}
                  disabled={!textContent.trim()}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Text Content
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
                <CardDescription>
                  Set your content information and pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter content title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your content..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-10"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <Button 
                  onClick={handleUpload}
                  disabled={isUploading || !title || !price || (uploadedFiles.length === 0 && !textContent)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isUploading ? (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload & Generate Link
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Link */}
            {generatedLink && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    Content Published!
                  </CardTitle>
                  <CardDescription>
                    Your content is now live and ready to share
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Share Link</Label>
                    <div className="flex space-x-2">
                      <Input value={generatedLink} readOnly />
                      <Button
                        variant="outline"
                        onClick={copyToClipboard}
                        className="flex-shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {qrCodeUrl && (
                    <div className="text-center">
                      <Label>QR Code</Label>
                      <div className="mt-2">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code" 
                          className="mx-auto border rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share on Instagram
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share on Telegram
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}