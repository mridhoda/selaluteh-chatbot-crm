-- Backfill canonical outlet_locations from outlet metadata coordinates/maps.
-- This supports multi-workspace deployments where outlets are created via the
-- regular Outlets UI before admin location verification rows exist.

insert into outlet_locations (
  workspace_id,
  outlet_id,
  provider,
  provider_place_id,
  source_url,
  google_maps_uri,
  display_name,
  formatted_address,
  city,
  province,
  country_code,
  postal_code,
  latitude,
  longitude,
  location_source,
  status,
  confidence,
  resolver_version,
  location_version,
  resolved_at,
  verified_at,
  last_verification_at,
  next_verification_at,
  updated_at
)
select
  o.workspace_id,
  o.id,
  'metadata',
  null,
  nullif(coalesce(o.metadata->>'googleMapsLink', o.metadata->>'googleMapsUrl'), ''),
  nullif(coalesce(o.metadata->>'googleMapsLink', o.metadata->>'googleMapsUrl'), ''),
  o.name,
  coalesce(nullif(o.address, ''), o.name),
  o.city,
  o.region,
  'ID',
  o.postal_code,
  (o.metadata->>'latitude')::double precision,
  (o.metadata->>'longitude')::double precision,
  'outlet_metadata',
  'VERIFIED',
  'high',
  'metadata-backfill-1.0.0',
  '1',
  now(),
  now(),
  now(),
  now() + interval '12 months',
  now()
from outlets o
where o.archived_at is null
  and o.status = 'active'
  and nullif(o.metadata->>'latitude', '') is not null
  and nullif(o.metadata->>'longitude', '') is not null
  and (o.metadata->>'latitude') ~ '^-?\d+(\.\d+)?$'
  and (o.metadata->>'longitude') ~ '^-?\d+(\.\d+)?$'
  and (o.metadata->>'latitude')::double precision between -90 and 90
  and (o.metadata->>'longitude')::double precision between -180 and 180
on conflict (workspace_id, outlet_id) do update set
  source_url = coalesce(excluded.source_url, outlet_locations.source_url),
  google_maps_uri = coalesce(excluded.google_maps_uri, outlet_locations.google_maps_uri),
  display_name = excluded.display_name,
  formatted_address = excluded.formatted_address,
  city = excluded.city,
  province = excluded.province,
  postal_code = excluded.postal_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  location_source = case
    when outlet_locations.location_source = 'provider_resolved' then outlet_locations.location_source
    else excluded.location_source
  end,
  status = case
    when outlet_locations.status in ('VERIFIED', 'NEEDS_REVIEW') then outlet_locations.status
    else 'VERIFIED'
  end,
  confidence = coalesce(outlet_locations.confidence, excluded.confidence),
  resolved_at = coalesce(outlet_locations.resolved_at, excluded.resolved_at),
  verified_at = coalesce(outlet_locations.verified_at, excluded.verified_at),
  last_verification_at = coalesce(outlet_locations.last_verification_at, excluded.last_verification_at),
  next_verification_at = coalesce(outlet_locations.next_verification_at, excluded.next_verification_at),
  updated_at = now();
