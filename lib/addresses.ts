import "server-only";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

export type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type AddressInput = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

const COLUMNS = "id,label,full_name,phone,line1,line2,city,state,postal_code,country,is_default";

type AddressRow = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

const mapAddress = (row: AddressRow): Address => ({
  id: row.id,
  label: row.label,
  fullName: row.full_name,
  phone: row.phone,
  line1: row.line1,
  line2: row.line2,
  city: row.city,
  state: row.state,
  postalCode: row.postal_code,
  country: row.country,
  isDefault: row.is_default,
});

/** The signed-in user's addresses, default first. */
export async function listAddresses(): Promise<Address[]> {
  const user = await requireUser("/account/addresses");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load addresses: ${error.message}`);
  }
  return (data as AddressRow[]).map(mapAddress);
}

export async function getAddress(id: string): Promise<Address | null> {
  const user = await requireUser("/account/addresses");
  if (!isUuid(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("addresses").select(COLUMNS).eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load address: ${error.message}`);
  }
  return data ? mapAddress(data as AddressRow) : null;
}

/**
 * Creates (or, with `id`, updates) an address for an already-authenticated user and
 * returns its id. A customer's first address always becomes their default.
 */
export async function upsertAddress(
  userId: string,
  input: AddressInput,
  { id, makeDefault = false }: { id?: string; makeDefault?: boolean } = {},
): Promise<string | null> {
  const supabase = await createClient();
  const row = {
    label: input.label,
    full_name: input.fullName,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode,
    country: "India",
  };

  let addressId = id;
  let shouldBeDefault = makeDefault;

  if (id) {
    const { data, error } = await supabase
      .from("addresses")
      .update(row)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      if (error) console.error("Address update failed:", error.message);
      return null;
    }
  } else {
    const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", userId);
    const { data, error } = await supabase.from("addresses").insert({ ...row, user_id: userId }).select("id").single();
    if (error) {
      console.error("Address insert failed:", error.message);
      return null;
    }
    addressId = data.id;
    shouldBeDefault ||= count === 0;
  }

  if (shouldBeDefault) {
    const { error } = await supabase.rpc("set_default_address", { p_address_id: addressId });
    if (error) {
      console.error("Setting default address failed:", error.message);
    }
  }

  return addressId ?? null;
}
