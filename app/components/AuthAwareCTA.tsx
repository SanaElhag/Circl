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

/**
 * A CTA link on a server-rendered marketing page (homepage, about) that
 * needs to say something different once you're already signed in — "Create
 * an Account" is a dead end for someone who already has one. The page
 * itself can't know auth state server-side (sessions live in localStorage,
 * not a cookie), so this resolves it client-side after mount, same as
 * TopNav does for the nav bar.
 *
 * Defaults to the signed-out label while the check is in flight, since
 * that's who most first-time visitors are — a signed-in visitor sees a
 * brief flash of the wrong label rather than a loading placeholder on every
 * CTA button on the page.
 */
export default function AuthAwareCTA({ signedOutHref, signedOutLabel, signedInHref, signedInLabel, className }: Props) {
  const user = useAuthUser();

  return (
    <Link href={user ? signedInHref : signedOutHref} className={className}>
      {user ? signedInLabel : signedOutLabel}
    </Link>
  );
}
