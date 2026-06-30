-- Harden the outlet access membership trigger function search path.

alter function set_user_outlet_access_membership_id()
  set search_path = public;
