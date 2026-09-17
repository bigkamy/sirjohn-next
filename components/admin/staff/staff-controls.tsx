"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { RoleBadge } from "@/components/admin/ui/badge";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { Field } from "@/components/admin/ui/fields";
import { buttonClass, inputClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { findUserByEmail, setUserRole, type FoundUser } from "@/lib/admin-staff-actions";
import { isStaffRole, ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { NETWORK_ERROR } from "@/lib/messages";

const staffRolesIn = (roles: UserRole[]) => roles.filter((role) => role !== "customer");

/** Find a registered account by email, then give it a staff role. */
export function AddStaffForm({ assignable }: { assignable: UserRole[] }) {
  const toast = useToast();
  const roles = staffRolesIn(assignable);
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<FoundUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(roles.includes("staff") ? "staff" : (roles[0] ?? "staff"));
  const [pending, startTransition] = useTransition();

  const search = () =>
    startTransition(async () => {
      setError(null);
      setFound(null);
      const result = await findUserByEmail(email).catch(() => ({ ok: false as const, message: NETWORK_ERROR }));
      if (result.ok) setFound(result.user);
      else setError(result.message);
    });

  const grant = () =>
    startTransition(async () => {
      if (!found) return;
      const result = await setUserRole(found.id, role).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      toast({ tone: result.ok ? "success" : "error", message: result.ok ? `${found.name}: ${result.message}` : result.message });
      if (result.ok) {
        setFound(null);
        setEmail("");
      }
    });

  const canChange = found !== null && assignable.includes(found.role);

  return (
    <div className="space-y-4 p-5">
      <form
        aria-label="Find an account"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <Field
          id="staff-email"
          label="Email address"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          errors={error ? [error] : undefined}
          className="flex-1"
        />
        <button type="submit" disabled={pending || !email} className={`${buttonClass("secondary")} sm:mb-[1px]`}>
          Find account
        </button>
      </form>

      {found && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{found.name}</p>
            <RoleBadge role={found.role} />
          </div>
          <p className="text-sm text-slate-500">{found.email}</p>
          {canChange ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="new-staff-role" className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                <select id="new-staff-role" value={role} onChange={(event) => setRole(event.target.value as UserRole)} className={inputClass}>
                  {roles.map((option) => (
                    <option key={option} value={option}>{ROLE_LABELS[option]}</option>
                  ))}
                </select>
              </div>
              <button type="button" disabled={pending || role === found.role} onClick={grant} className={buttonClass("primary")}>
                <UserPlus size={15} aria-hidden /> {isStaffRole(found.role) ? "Change role" : "Give access"}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Only a super admin can change this person&apos;s access.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Changes a team member's role, limited to the roles the signed-in person may hand out. */
export function RoleSelect({ userId, name, role, assignable, isSelf }: { userId: string; name: string; role: UserRole; assignable: UserRole[]; isSelf: boolean }) {
  const toast = useToast();
  const roles = staffRolesIn(assignable);
  const [value, setValue] = useState<UserRole>(role);
  const [pending, startTransition] = useTransition();

  if (isSelf) return <span className="text-xs text-slate-500">This is you</span>;
  if (!assignable.includes(role)) return <span className="text-xs text-slate-500">Super admin only</span>;

  const save = () =>
    startTransition(async () => {
      const result = await setUserRole(userId, value).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      toast({ tone: result.ok ? "success" : "error", message: result.ok ? `${name}: ${result.message}` : result.message });
      if (!result.ok) setValue(role);
    });

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(event) => setValue(event.target.value as UserRole)}
        aria-label={`Role for ${name}`}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
      >
        {roles.map((option) => (
          <option key={option} value={option}>{ROLE_LABELS[option]}</option>
        ))}
      </select>
      {value !== role && (
        <button type="button" disabled={pending} onClick={save} className={buttonClass("secondary", "sm")}>
          {pending ? "Saving…" : "Save"}
        </button>
      )}
    </div>
  );
}

export function RemoveAccessButton({ userId, name }: { userId: string; name: string }) {
  const toast = useToast();
  return (
    <ConfirmButton
      label={<><UserMinus size={13} aria-hidden /> Remove</>}
      ariaLabel={`Remove admin access for ${name}`}
      title={`Remove ${name}'s admin access?`}
      description="They keep their customer account and order history, but can no longer open the admin panel."
      confirmLabel="Remove access"
      onConfirm={async () => {
        const result = await setUserRole(userId, "customer").catch(() => ({ ok: false, message: NETWORK_ERROR }));
        toast({ tone: result.ok ? "success" : "error", message: result.ok ? `${name}: ${result.message}` : result.message });
      }}
    />
  );
}
