import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { createClient } from '@blinkdotnew/sdk'
import { Upload, Link, DollarSign, Download, ArrowRight, Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card } from './components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import PaymentPage from './pages/PaymentPage'

const blink = createClient({
  projectId: 'media-monetization-link-platform-qrov5zto',
  authRequired: true
})

function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState([])
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [uploading, setUploading] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
  }

  const generateLink = async () => {
    if (!files.length || !price) return
    
    setUploading(true)
    try {
      // Upload files to storage
      const uploadPromises = files.map(async (file) => {
        const { publicUrl } = await blink.storage.upload(file, `content/${Date.now()}-${file.name}`)
        return { name: file.name, url: publicUrl, size: file.size }
      })
      
      const uploadedFiles = await Promise.all(uploadPromises)
      
      // Create content record in database
      const contentId = `content_${Date.now()}`
      await blink.db.content_items.create({
        id: contentId,
        user_id: user.id,
        title: files.map(f => f.name).join(', '),
        type: 'files',
        files: JSON.stringify(uploadedFiles),
        price: parseFloat(price),
        currency: currency,
        created_at: new Date().toISOString(),
        views: 0,
        earnings: 0
      })
      
      // Generate shareable link
      const link = `${window.location.origin}/pay/${contentId}`
      setShareLink(link)
      
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFiles([])
    setPrice('')
    setShareLink('')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading PayTransfer...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Link className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-slate-900 mb-3">PayTransfer</h1>
            <p className="text-xl text-slate-600">Upload. Price. Share. Get Paid.</p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Upload</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Price</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Earn</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              Simple file sharing with built-in monetization. Like WeTransfer, but you get paid.
            </p>
          </div>
          
          <Button
            onClick={() => blink.auth.login()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Start Earning Now
          </Button>
        </div>
      </div>
    )
  }

  if (shareLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Share!</h2>
          <p className="text-slate-600 mb-8">Your files are uploaded and ready to be monetized</p>
          
          <div className="bg-slate-50 p-6 rounded-xl mb-8">
            <p className="text-sm font-medium text-slate-700 mb-3">Your monetized link:</p>
            <div className="flex items-center gap-3">
              <Input 
                value={shareLink} 
                readOnly 
                className="text-sm bg-white border-slate-200" 
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3 mb-6">
            <Button 
              onClick={resetForm} 
              variant="outline" 
              className="flex-1"
            >
              Upload More
            </Button>
            <Button 
              onClick={() => window.open(shareLink, '_blank')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Share this link anywhere - Instagram, Telegram, Twitter, email...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Minimal Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Link className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">PayTransfer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user.email}
            </span>
            <Button
              onClick={() => blink.auth.logout()}
              variant="outline"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - WeTransfer Style */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Upload. Price. Get Paid.
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The simplest way to monetize file sharing. Upload any file, set your price, and share the link anywhere.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto p-8 shadow-xl bg-white/80 backdrop-blur-sm">
          {/* File Upload Zone - WeTransfer Style */}
          <div className="mb-8">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : files.length 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {files.length > 0 ? (
                <div>
                  <Check className="w-16 h-16 text-green-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {files.length} file{files.length > 1 ? 's' : ''} ready
                  </h3>
                  <div className="text-slate-600 space-y-2 max-w-md mx-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <span className="font-medium truncate">{file.name}</span>
                        <span className="text-sm text-slate-500 ml-2">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Drop files here
                  </h3>
                  <p className="text-slate-500 mb-6">
                    or click to browse from your device
                  </p>
                  <p className="text-sm text-slate-400">
                    Any file type • Up to 100MB per file
                  </p>
                </div>
              )}
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Price Setting */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-slate-900 mb-4">
              Set your price
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-12 py-4 text-lg border-slate-300 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-32 py-4 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR €</SelectItem>
                  <SelectItem value="USD">USD $</SelectItem>
                  <SelectItem value="GBP">GBP £</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Link Button */}
          <Button
            onClick={generateLink}
            disabled={!files.length || !price || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Uploading files...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                Generate Monetized Link
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </Card>

        {/* How it works - Simplified */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-slate-900 mb-12">How it works</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">1. Upload & Price</h4>
              <p className="text-slate-600">Drop your files and set a price. Any file type, up to 100MB each.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Link className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">2. Share Link</h4>
              <p className="text-slate-600">Get a secure link to share on Instagram, Telegram, or anywhere.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">3. Get Paid</h4>
              <p className="text-slate-600">Receive payment instantly when someone downloads your files.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pay/:contentId" element={<PaymentPage />} />
      </Routes>
    </Router>
  )
}

export default App