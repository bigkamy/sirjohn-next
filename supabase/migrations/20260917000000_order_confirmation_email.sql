-- Order confirmation email: delivery state kept on the order itself, plus the two functions
-- the app calls to claim a send and record its result.
--
-- No new table: there is one transactional email per order, and every attempt is already
-- recorded in staff_activity, which the admin order timeline shows.
--
-- Sending is never done by the database. The app claims an order, calls the email provider,
-- and reports back; the claim is what stops a second email going out.

alter table public.orders
  add column confirmation_email_status text not null default 'pending'
    check (confirmation_email_status in ('pending', 'sending', 'sent', 'failed')),
  add column confirmation_email_sent_at timestamptz,
  add column confirmation_email_error text,
  add column confirmation_email_attempts integer not null default 0 check (confirmation_email_attempts >= 0),
  add column confirmation_email_attempted_at timestamptz;

comment on column public.orders.confirmation_email_status is
  'pending = not sent yet, sending = claimed by an app process, sent = accepted by the email provider, failed = the provider rejected it.';
comment on column public.orders.confirmation_email_error is
  'Last provider failure, for staff. Never shown to customers.';

-- Orders still waiting on their confirmation email, for the system health page.
create index orders_confirmation_email_status_idx
  on public.orders (confirmation_email_status)
  where confirmation_email_status <> 'sent';

-- ---------------------------------------------------------------------------
-- Claiming a send
-- ---------------------------------------------------------------------------

-- Reserves the one confirmation email for an order and returns which attempt this is, so the
-- caller can build a provider idempotency key. The row lock plus the status check mean two
-- concurrent callers can never both get a claim.
--
-- A customer may only trigger the first send of their own order. Resending (p_force) needs
-- orders.manage, the same permission the admin panel checks.
create function public.claim_order_confirmation_email(
  p_order_number text,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_is_staff boolean := (select public.has_permission('orders.manage'));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_force and not v_is_staff then
    raise exception 'not_authorized';
  end if;

  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.user_id is distinct from auth.uid() and not v_is_staff then
    raise exception 'not_authorized';
  end if;

  -- Another process is mid-send. Two minutes covers a slow provider call; past that the
  -- claim is treated as abandoned so a resend can recover it.
  if v_order.confirmation_email_status = 'sending'
    and v_order.confirmation_email_attempted_at > now() - interval '2 minutes' then
    raise exception 'email_in_progress';
  end if;

  if v_order.confirmation_email_status = 'sent' and not p_force then
    raise exception 'email_already_sent';
  end if;

  -- One attempt a minute per order, so a held-down resend button can't flood the customer.
  if v_order.confirmation_email_attempted_at > now() - interval '1 minute'
    and v_order.confirmation_email_status <> 'sending' then
    raise exception 'email_too_soon';
  end if;

  update public.orders
  set confirmation_email_status = 'sending',
      confirmation_email_attempts = confirmation_email_attempts + 1,
      confirmation_email_attempted_at = now(),
      confirmation_email_error = null
  where id = v_order.id
  returning * into v_order;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'attempt', v_order.confirmation_email_attempts,
    'resent', v_order.confirmation_email_sent_at is not null
  );
end;
$$;

revoke execute on function public.claim_order_confirmation_email(text, boolean) from public, anon;
grant execute on function public.claim_order_confirmation_email(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Recording the result
-- ---------------------------------------------------------------------------

-- Stores what the provider said and writes the attempt to the activity log. Automatic sends
-- are logged as "System"; a staff resend is logged against the staff member.
create function public.record_order_confirmation_email(
  p_order_id uuid,
  p_ok boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_is_staff boolean := (select public.has_permission('orders.manage'));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.user_id is distinct from auth.uid() and not v_is_staff then
    raise exception 'not_authorized';
  end if;

  update public.orders
  set confirmation_email_status = case when p_ok then 'sent' else 'failed' end,
      confirmation_email_sent_at = case when p_ok then now() else v_order.confirmation_email_sent_at end,
      confirmation_email_error = case when p_ok then null else left(p_error, 300) end
  where id = v_order.id;

  insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary, level, details)
  values (
    case when v_is_staff then auth.uid() end,
    case when v_is_staff then public.my_role() end,
    'order.email',
    'order',
    v_order.order_number,
    case
      when p_ok and v_order.confirmation_email_attempts > 1
        then 'Order confirmation email resent to ' || v_order.email
      when p_ok then 'Order confirmation email sent to ' || v_order.email
      else left('Order confirmation email failed: ' || coalesce(p_error, 'unknown error'), 300)
    end,
    case when p_ok then 'info' else 'error' end,
    jsonb_build_object('attempt', v_order.confirmation_email_attempts)
  );
end;
$$;

revoke execute on function public.record_order_confirmation_email(uuid, boolean, text) from public, anon;
grant execute on function public.record_order_confirmation_email(uuid, boolean, text) to authenticated;
