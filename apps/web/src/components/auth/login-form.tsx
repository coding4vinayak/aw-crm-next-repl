'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        mfaToken: showMfaInput ? mfaToken : undefined,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'MFA_REQUIRED') {
          setShowMfaInput(true);
          setError('Please enter your MFA code');
        } else if (result.error === 'INVALID_MFA_TOKEN') {
          setError('Invalid MFA code. Please try again.');
        } else {
          setError('Invalid email or password');
        }
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className=\"w-full\">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className=\"space-y-4\">
          {error && (
            <Alert variant=\"destructive\">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className=\"space-y-2\">
            <Label htmlFor=\"email\">Email</Label>
            <Input
              id=\"email\"
              type=\"email\"
              placeholder=\"name@example.com\"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className=\"space-y-2\">
            <Label htmlFor=\"password\">Password</Label>
            <div className=\"relative\">
              <Input
                id=\"password\"
                type={showPassword ? 'text' : 'password'}
                placeholder=\"••••••••\"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <Button
                type=\"button\"
                variant=\"ghost\"
                size=\"sm\"
                className=\"absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent\"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className=\"h-4 w-4\" />
                ) : (
                  <Eye className=\"h-4 w-4\" />
                )}
              </Button>
            </div>
          </div>

          {showMfaInput && (
            <div className=\"space-y-2\">
              <Label htmlFor=\"mfaToken\" className=\"flex items-center gap-2\">
                <Shield className=\"h-4 w-4\" />
                MFA Code
              </Label>
              <Input
                id=\"mfaToken\"
                type=\"text\"
                placeholder=\"123456\"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                maxLength={6}
                required
                disabled={isLoading}
              />
              <p className=\"text-sm text-gray-600\">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}

          <div className=\"flex items-center justify-between\">
            <a
              href=\"/auth/forgot-password\"
              className=\"text-sm text-indigo-600 hover:text-indigo-500\"
            >
              Forgot your password?
            </a>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type=\"submit\" className=\"w-full\" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}