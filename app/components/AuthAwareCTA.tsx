"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";

interface Props {
  signedOutHref: string;
  signedOutLabel: string;
  signedInHref: string;
  signedInLabel: string;
  className?: string;
}

// a CTA button on the homepage/about page that needs to say something
// different if you're already signed in ("Create an account" doesn't make
// sense anymore). these pages are server-rendered and can't check login
// state themselves, so this checks on the client after the page loads,
// same as TopNav does. shows the signed-out version first since that's
// most visitors - signed-in people just see it swap after a moment
export default function AuthAwareCTA({ signedOutHref, signedOutLabel, signedInHref, signedInLabel, className }: Props) {
  const user = useAuthUser();

  return (
    <Link href={user ? signedInHref : signedOutHref} className={className}>
      {user ? signedInLabel : signedOutLabel}
    </Link>
  );
}
