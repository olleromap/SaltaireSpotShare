-- Fix zero-padded spot numbers: e.g. R2-01 -> R2-1
-- If an unpadded version already exists (from a re-run seed), delete the padded duplicate first
DELETE FROM "ParkingSpot"
WHERE "spotNumber" ~ '^R\d+-0\d'
  AND regexp_replace("spotNumber", '^(R\d+-)0+(\d+)$', '\1\2') IN (
    SELECT "spotNumber" FROM "ParkingSpot" WHERE "spotNumber" !~ '^R\d+-0\d'
  );

-- Rename remaining padded spots to unpadded format
UPDATE "ParkingSpot"
SET "spotNumber" = regexp_replace("spotNumber", '^(R\d+-)0+(\d+)$', '\1\2')
WHERE "spotNumber" ~ '^R\d+-0\d';
