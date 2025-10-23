'use client';

import { useUI } from '@/contexts/UIContext';
import AuthForm from './AuthForm';

export default function AuthModal() {
  const { isAuthModalOpen } = useUI();

  if (!isAuthModalOpen) return null;

  return <AuthForm />;
}