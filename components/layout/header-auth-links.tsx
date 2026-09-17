"use client";

import Link from "next/link";
import { useShopperState } from "@/components/shopper/shopper-state";
import { logout } from "@/lib/auth/actions";

const linkClass = "font-medium text-white hover:text-brand-300";

export function HeaderAuthLinks() {
  const { signedIn, name, initials, avatarUrl } = useShopperState();

  return (
    <>
      {signedIn ? (
        <>
          {/* Who is signed in. The details arrive from /api/shopper after hydration, so the
              band stays the same height whether or not anyone is signed in. */}
          <Link href="/account" className="flex items-center gap-2 text-white hover:text-brand-300">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-white/25"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/25 text-[10px] font-bold text-brand-200 ring-1 ring-white/25"
              >
                {initials}
              </span>
            )}
            <span className="max-w-[10rem] truncate font-medium">{name}</span>
          </Link>
          <span>•</span>
          <form action={logout}>
            <button type="submit" className={linkClass}>
              Logout
            </button>
          </form>
        </>
      ) : (
        <Link href="/login" className={linkClass}>
          Login / Register
        </Link>
      )}
      <span>•</span>
      <Link href="/account" className={linkClass}>
        My Account
      </Link>
    </>
  );
}
