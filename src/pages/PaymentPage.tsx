import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { createClient } from '@blinkdotnew/sdk'
import { Download, Lock, CreditCard, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'

const blink = createClient({
  projectId: 'media-monetization-link-platform-qrov5zto',
  authRequired: false
})

export default function PaymentPage() {
  const { contentId } = useParams()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const loadContent = useCallback(async () => {
    try {
      const contentData = await blink.db.contentItems.list({
        where: { id: contentId },
        limit: 1
      })
      
      if (contentData.length > 0) {
        setContent(contentData[0])
        // Increment view count
        await blink.db.contentItems.update(contentId, {
          views: (contentData[0].views || 0) + 1
        })
      }
    } catch (error) {
      console.error('Failed to load content:', error)
      setError('Content not found')
    } finally {
      setLoading(false)
    }
  }, [contentId])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const handlePayment = async () => {
    if (!email || !content) return
    
    setPaying(true)
    setError('')
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Record payment
      await blink.db.payments.create({
        id: `payment_${Date.now()}`,
        contentId: contentId,
        buyerEmail: email,
        amount: content.price,
        currency: content.currency,
        paymentStatus: 'completed',
        createdAt: new Date().toISOString()
      })
      
      // Update content earnings
      await blink.db.contentItems.update(contentId, {
        earnings: (content.earnings || 0) + content.price
      })
      
      setPaid(true)
    } catch (error) {
      console.error('Payment failed:', error)
      setError('Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const downloadFiles = () => {
    if (!content || !paid) return
    
    try {
      const files = JSON.parse(content.contentUrls)
      files.forEach((file, index) => {
        setTimeout(() => {
          const link = document.createElement('a')
          link.href = file.url
          link.download = file.name
          link.click()
        }, index * 500) // Stagger downloads
      })
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error && !content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Content Not Found</h2>
          <p className="text-slate-600 mb-6">This link may have expired or been removed.</p>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
          <p className="text-slate-600 mb-8">Your files are ready for download</p>
          
          <div className="bg-slate-50 p-6 rounded-xl mb-8">
            <h3 className="font-semibold text-slate-900 mb-3">{content.title}</h3>
            <p className="text-sm text-slate-600 mb-4">
              {JSON.parse(content.contentUrls).length} file(s) • 
              Paid {content.price} {content.currency}
            </p>
          </div>
          
          <Button
            onClick={downloadFiles}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 mb-4"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Files
          </Button>
          
          <p className="text-xs text-slate-500">
            Downloads will start automatically. Check your downloads folder.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Secure Content</h1>
          <p className="text-slate-600">Pay to access this content</p>
        </div>

        {/* Content Preview */}
        <div className="bg-slate-50 p-6 rounded-xl mb-8">
          <h3 className="font-bold text-slate-900 mb-3">{content.title}</h3>
          <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
            <span>{JSON.parse(content.contentUrls).length} file(s)</span>
            <span>{content.views || 0} views</span>
          </div>
          
          <div className="space-y-2">
            {JSON.parse(content.contentUrls).map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                <span className="font-medium text-slate-700 truncate">{file.name}</span>
                <span className="text-xs text-slate-500 ml-2">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-slate-900 mb-2">
            {content.price} {content.currency}
          </div>
          <p className="text-slate-600">One-time payment for instant access</p>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handlePayment}
            disabled={!email || paying}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
          >
            {paying ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pay {content.price} {content.currency}
              </div>
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            🔒 Secure payment • Files delivered instantly • No subscription
          </p>
        </div>
      </Card>
    </div>
  )
}