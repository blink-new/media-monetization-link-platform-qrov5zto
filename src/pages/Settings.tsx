import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Globe,
  Download,
  Trash2,
  Save
} from 'lucide-react'
import { blink } from '@/blink/client'

export function Settings() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  })
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showEarnings: false,
    allowAnalytics: true
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (state.user) {
        setUser(state.user)
        setDisplayName(state.user.displayName || '')
        setEmail(state.user.email || '')
      }
    })
    return unsubscribe
  }, [])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await blink.auth.updateMe({
        displayName: displayName
      })
      
      // Save other settings to database
      await blink.db.userSettings.upsert({
        userId: user.id,
        currency,
        notifications,
        privacy,
        updatedAt: new Date().toISOString()
      })
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Delete user data
        await blink.db.contentItems.deleteMany({
          where: { userId: user.id }
        })
        
        // Logout user
        blink.auth.logout()
        
        alert('Account deleted successfully.')
      } catch (error) {
        console.error('Failed to delete account:', error)
        alert('Failed to delete account. Please contact support.')
      }
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account preferences and privacy settings.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="currency">Default Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Receive email updates about your content and earnings
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Get instant notifications for new purchases
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-notifications">Marketing Emails</Label>
                  <p className="text-sm text-gray-600">
                    Receive tips, updates, and promotional content
                  </p>
                </div>
                <Switch
                  id="marketing-notifications"
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, marketing: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-public">Public Profile</Label>
                  <p className="text-sm text-gray-600">
                    Allow others to discover your content
                  </p>
                </div>
                <Switch
                  id="profile-public"
                  checked={privacy.profilePublic}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, profilePublic: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-earnings">Show Earnings</Label>
                  <p className="text-sm text-gray-600">
                    Display your earnings publicly on your profile
                  </p>
                </div>
                <Switch
                  id="show-earnings"
                  checked={privacy.showEarnings}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, showEarnings: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-gray-600">
                    Help us improve by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={privacy.allowAnalytics}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, allowAnalytics: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Manage your account data and subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="flex-1">
                  <Globe className="h-4 w-4 mr-2" />
                  View Public Profile
                </Button>
              </div>

              <Separator />

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}