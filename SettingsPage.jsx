import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Settings page coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage

