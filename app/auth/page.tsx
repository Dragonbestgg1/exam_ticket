'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import style from '@/styles/pages/auth.module.css'
import Header from '@/components/ui/Header';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials');
    } else {
      router.push('/');
    }
  };

  return (
    <div className={`${style.main}`}>
      <Header />
      <div className={`${style.card}`}>
        <h2 className={`${style.title}`}>Admin Login</h2>
        <form className={`${style.form}`} onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              placeholder='Username'
              type="text"
              id="username"
              className={`${style.input}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              placeholder='Password'
              type="password"
              id="password"
              className={`${style.input}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className={`${style.error}`}>{error}</p>}
          <button type="submit" className={`${style.button}`}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}