'use client';
import dynamic from 'next/dynamic';

const Onboarding = dynamic(() => import('./Onboarding.jsx'), { ssr: false });

export default function OnboardingWrapper() {
  return <Onboarding />;
}
