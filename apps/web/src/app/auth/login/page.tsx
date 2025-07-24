import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login | AWCRM',
  description: 'Sign in to your AWCRM account',
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-md w-full space-y-8\">
        <div className=\"text-center\">
          <h1 className=\"text-4xl font-bold text-gray-900\">AWCRM</h1>
          <h2 className=\"mt-6 text-3xl font-extrabold text-gray-900\">
            Sign in to your account
          </h2>
          <p className=\"mt-2 text-sm text-gray-600\">
            Or{' '}
            <a
              href=\"/auth/register\"
              className=\"font-medium text-indigo-600 hover:text-indigo-500\"
            >
              create a new account
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}