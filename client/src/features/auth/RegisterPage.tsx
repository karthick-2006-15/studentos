import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { useAuthStore } from '../../stores/authStore';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#09090b]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-base shadow-sm">
            N
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Create Account</h1>
          <p className="text-xs text-zinc-400">Initialize your personal student operating system</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Chen"
              required
              autoFocus
            />

            <Input
              type="email"
              label="Student Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.edu"
              required
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Get Started
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-[#121215] px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <GoogleSignInButton mode="signup" onError={(msg) => setError(msg)} />
          </form>

          <div className="mt-5 text-center text-xs text-zinc-400">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
