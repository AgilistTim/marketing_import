import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, BarChart3, TrendingUp, Users, Zap } from 'lucide-react'
import { useAuth } from '../../App'
import LoadingSpinner from '../ui/LoadingSpinner'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-primary rounded-lg p-3">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your Marketing Analytics Platform account
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Demo Account
                </p>
                <p className="text-xs text-center">
                  Email: admin@example.com<br />
                  Password: admin123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Marketing content */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-8">
        <div className="max-w-md text-center space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Unify Your Marketing Data
            </h2>
            <p className="text-lg text-muted-foreground">
              Connect all your marketing platforms in one place and get actionable insights
              to drive better results.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Real-time Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Monitor performance across all channels
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Multi-Platform</h3>
              <p className="text-sm text-muted-foreground">
                Google Ads, Facebook, Analytics & more
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Excel Integration</h3>
              <p className="text-sm text-muted-foreground">
                Direct data feeds to your spreadsheets
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Custom Reports</h3>
              <p className="text-sm text-muted-foreground">
                Build reports that matter to your business
              </p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <blockquote className="text-sm italic">
              "This platform has transformed how we analyze our marketing performance. 
              Having all our data in one place saves us hours every week."
            </blockquote>
            <cite className="text-xs text-muted-foreground mt-2 block">
              — Marketing Director, Tech Startup
            </cite>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

