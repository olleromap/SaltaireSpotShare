-- Safe idempotent fix for zero-padded spot numbers (v2)
-- Deletes padded duplicates where an unpadded version already exists, then renames the rest.
-- No-op if spots are already in correct format.

DO $$
DECLARE
  r RECORD;
  fixed TEXT;
BEGIN
  FOR r IN
    SELECT id, "spotNumber"
    FROM "ParkingSpot"
    WHERE "spotNumber" ~ '^R[0-9]+-0[0-9]'
  LOOP
    fixed := regexp_replace(r."spotNumber", '^(R[0-9]+-)0+([0-9]+)$', '\1\2');
    IF EXISTS (SELECT 1 FROM "ParkingSpot" WHERE "spotNumber" = fixed AND id <> r.id) THEN
      DELETE FROM "ParkingSpot" WHERE id = r.id;
    ELSE
      UPDATE "ParkingSpot" SET "spotNumber" = fixed WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- Ensure R prefix on any spots missing it
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, "spotNumber"
    FROM "ParkingSpot"
    WHERE "spotNumber" !~ '^R'
  LOOP
    UPDATE "ParkingSpot"
    SET "spotNumber" = 'R' || r."spotNumber"
    WHERE id = r.id
      AND NOT EXISTS (
        SELECT 1 FROM "ParkingSpot" WHERE "spotNumber" = 'R' || r."spotNumber"
      );
  END LOOP;
END $$;
