import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  DollarSign, 
  Eye, 
  Share2, 
  TrendingUp, 
  Image, 
  Video, 
  FileText,
  Copy,
  QrCode
} from 'lucide-react'
import { blink } from '@/blink/client'

interface ContentItem {
  id: string
  title: string
  type: 'image' | 'video' | 'text'
  price: number
  views: number
  earnings: number
  createdAt: string
  shareLink: string
  status: 'active' | 'draft'
}

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalViews: 0,
    totalContent: 0,
    conversionRate: 0
  })

  const loadDashboardData = useCallback(async () => {
    try {
      // Load content items from database
      const items = await blink.db.contentItems.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' },
        limit: 10
      })
      
      setContentItems(items || [])
      
      // Calculate stats
      const totalEarnings = items?.reduce((sum, item) => sum + item.earnings, 0) || 0
      const totalViews = items?.reduce((sum, item) => sum + item.views, 0) || 0
      const totalContent = items?.length || 0
      const conversionRate = totalViews > 0 ? (totalEarnings / totalViews) * 100 : 0
      
      setStats({
        totalEarnings,
        totalViews,
        totalContent,
        conversionRate
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadDashboardData()
      }
    })
    return unsubscribe
  }, [loadDashboardData])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's how your content is performing today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Items</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContent}</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                +2.5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Content</CardTitle>
              <CardDescription>
                Your latest uploaded content and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentItems.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start by uploading your first piece of content to monetize.
                  </p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">
                            ${item.price} • {item.views} views • ${item.earnings} earned
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.shareLink)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with these common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Content
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4 mr-2" />
                Share on Instagram
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Your earnings and views over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Performance chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}