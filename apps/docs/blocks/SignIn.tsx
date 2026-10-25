'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, LiquidGlass, Switch, toast, Toaster } from '@vizzele/react';
import { MeshGradient } from '@vizzele/react/gl';

/** A sign-in card of liquid glass floating over a living gradient. */
export function SignIn() {
  const [loading, setLoading] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Signed in — welcome back');
    }, 1200);
  };
  return (
    <div className="blk-signin">
      <MeshGradient
        className="blk-signin-bg"
        speed={0.2}
        colors={['#00e5ff', '#7c5cff', '#ff2bd6', '#3b2bff']}
      />
      <LiquidGlass className="blk-signin-card">
        <form onSubmit={onSubmit}>
          <h3>Welcome back</h3>
          <p>Sign in to keep building interfaces that feel alive.</p>
          <Input label="Email" type="email" autoComplete="email" required />
          <Input label="Password" type="password" autoComplete="current-password" required />
          <div className="blk-signin-row">
            <Switch label="Remember me" defaultChecked />
            <a href="#forgot">Forgot?</a>
          </div>
          <Button type="submit" variant="liquid" loading={loading}>
            Sign in
          </Button>
          <Button type="button" variant="ghost" onClick={() => toast('GitHub sign-in goes here')}>
            Continue with GitHub
          </Button>
        </form>
      </LiquidGlass>
      <Toaster />
    </div>
  );
}
