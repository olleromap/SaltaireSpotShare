-- Fix zero-padded spot numbers: e.g. R2-01 -> R2-1
-- Only affects spots where the number after the hyphen has a leading zero
UPDATE "ParkingSpot"
SET "spotNumber" = regexp_replace("spotNumber", '^(R\d+-)0+(\d+)$', '\1\2')
WHERE "spotNumber" ~ '^R\d+-0\d';
