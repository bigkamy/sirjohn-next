"use client";

import Link from "next/link";
import { useShopperState } from "@/components/shopper/shopper-state";
import { logout } from "@/lib/auth/actions";

const linkClass = "font-medium text-white hover:text-emerald-300";

export function HeaderAuthLinks() {
  const { signedIn } = useShopperState();

  return (
    <>
      {signedIn ? (
        <form action={logout}>
          <button type="submit" className={linkClass}>
            Logout
          </button>
        </form>
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
