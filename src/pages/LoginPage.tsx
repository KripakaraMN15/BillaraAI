import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LogIn, Mail, Lock, Chrome, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const syncUser = async (user: any) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUser(result.user);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please enable it in your Firebase Console under Authentication > Sign-in method.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await syncUser(result.user);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled. Please enable it in your Firebase Console under Authentication > Sign-in method.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-neutral-900 text-white">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-xl font-sans">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight">BillaraAI</span>
          </div>
          <h1 className="text-6xl font-serif leading-tight">
            The future of <br />
            <span className="text-neutral-400 font-normal italic">billing is intelligent.</span>
          </h1>
        </div>
        <div className="max-w-md">
          <p className="text-lg text-neutral-400">
            Professional invoice management with cloud synchronization, smart parsing, and automated client communication.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-col w-full lg:w-1/2 p-8 bg-neutral-50 relative">
        <div className="absolute top-8 left-8">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to landing
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
            <p className="text-neutral-500">
              {isLogin ? 'Enter your details to sign in' : 'Start your journey with BillaraAI'}
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full p-3 mb-6 bg-white border border-neutral-200 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-neutral-50 text-neutral-400 leading-none">Or email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                  placeholder="name@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            <button
              type="submit"
              className="w-full p-3 bg-neutral-900 text-white rounded-lg font-bold hover:bg-neutral-800 transition-colors"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-neutral-900 font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  </div>
);
}
