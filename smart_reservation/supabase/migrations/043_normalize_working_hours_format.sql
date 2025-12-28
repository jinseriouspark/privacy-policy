-- ============================================================================
-- Migration 043: Normalize working_hours format
-- ============================================================================
-- Purpose: Convert legacy numeric day keys to named day keys
-- Legacy format: {"2": {"start": "10:00", "end": "19:00", "isWorking": true}}
-- New format: {"tuesday": {"enabled": true, "blocks": [{"start": "10:00", "end": "19:00"}]}}
-- ============================================================================

-- Function to convert legacy working hours to new format
CREATE OR REPLACE FUNCTION normalize_working_hours(old_hours JSONB)
RETURNS JSONB AS $$
DECLARE
  new_hours JSONB := '{}'::jsonb;
  day_key TEXT;
  day_name TEXT;
  day_data JSONB;
  is_enabled BOOLEAN;
  start_time TEXT;
  end_time TEXT;
BEGIN
  -- Map numeric keys to day names
  -- 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

  -- Check if already in new format (has 'monday', 'tuesday', etc.)
  IF old_hours ? 'monday' OR old_hours ? 'tuesday' THEN
    -- Already in new format, but might have mixed keys - clean it up
    new_hours := jsonb_build_object(
      'monday', COALESCE(old_hours->'monday', '{"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}'::jsonb),
      'tuesday', COALESCE(old_hours->'tuesday', '{"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}'::jsonb),
      'wednesday', COALESCE(old_hours->'wednesday', '{"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}'::jsonb),
      'thursday', COALESCE(old_hours->'thursday', '{"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}'::jsonb),
      'friday', COALESCE(old_hours->'friday', '{"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}'::jsonb),
      'saturday', COALESCE(old_hours->'saturday', '{"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}'::jsonb),
      'sunday', COALESCE(old_hours->'sunday', '{"enabled": false, "blocks": []}'::jsonb)
    );
    RETURN new_hours;
  END IF;

  -- Convert from old numeric format
  FOR day_key IN SELECT * FROM jsonb_object_keys(old_hours)
  LOOP
    day_data := old_hours->day_key;

    -- Map numeric key to day name
    day_name := CASE day_key
      WHEN '0' THEN 'sunday'
      WHEN '1' THEN 'monday'
      WHEN '2' THEN 'tuesday'
      WHEN '3' THEN 'wednesday'
      WHEN '4' THEN 'thursday'
      WHEN '5' THEN 'friday'
      WHEN '6' THEN 'saturday'
      ELSE day_key  -- Keep named keys as-is
    END;

    -- Extract values from old format
    is_enabled := COALESCE((day_data->>'isWorking')::boolean, false);
    start_time := COALESCE(day_data->>'start', '09:00');
    end_time := COALESCE(day_data->>'end', '18:00');

    -- Build new format
    new_hours := new_hours || jsonb_build_object(
      day_name,
      jsonb_build_object(
        'enabled', is_enabled,
        'blocks', CASE
          WHEN is_enabled THEN jsonb_build_array(
            jsonb_build_object(
              'start', start_time,
              'end', end_time
            )
          )
          ELSE '[]'::jsonb
        END
      )
    );
  END LOOP;

  -- Ensure all 7 days are present
  IF NOT new_hours ? 'monday' THEN
    new_hours := new_hours || '{"monday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}}'::jsonb;
  END IF;
  IF NOT new_hours ? 'tuesday' THEN
    new_hours := new_hours || '{"tuesday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}}'::jsonb;
  END IF;
  IF NOT new_hours ? 'wednesday' THEN
    new_hours := new_hours || '{"wednesday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}}'::jsonb;
  END IF;
  IF NOT new_hours ? 'thursday' THEN
    new_hours := new_hours || '{"thursday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}}'::jsonb;
  END IF;
  IF NOT new_hours ? 'friday' THEN
    new_hours := new_hours || '{"friday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}}'::jsonb;
  END IF;
  IF NOT new_hours ? 'saturday' THEN
    new_hours := new_hours || '{"saturday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}}'::jsonb;
  END IF;
  IF NOT new_hours ? 'sunday' THEN
    new_hours := new_hours || '{"sunday": {"enabled": false, "blocks": []}}'::jsonb;
  END IF;

  RETURN new_hours;
END;
$$ LANGUAGE plpgsql;

-- Update all coachings with legacy format
UPDATE coachings
SET working_hours = normalize_working_hours(working_hours)
WHERE working_hours IS NOT NULL
  AND (
    working_hours ? '0' OR
    working_hours ? '1' OR
    working_hours ? '2' OR
    working_hours ? '3' OR
    working_hours ? '4' OR
    working_hours ? '5' OR
    working_hours ? '6'
  );

-- Update all packages with legacy format
UPDATE packages
SET working_hours = normalize_working_hours(working_hours)
WHERE working_hours IS NOT NULL
  AND (
    working_hours ? '0' OR
    working_hours ? '1' OR
    working_hours ? '2' OR
    working_hours ? '3' OR
    working_hours ? '4' OR
    working_hours ? '5' OR
    working_hours ? '6'
  );

-- Report results
DO $$
DECLARE
  coaching_count INTEGER;
  package_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO coaching_count FROM coachings WHERE working_hours IS NOT NULL;
  SELECT COUNT(*) INTO package_count FROM packages WHERE working_hours IS NOT NULL;

  RAISE NOTICE '✅ Normalized % coaching working_hours', coaching_count;
  RAISE NOTICE '✅ Normalized % package working_hours', package_count;
END $$;

-- ============================================================================
-- Example: Before and After
-- ============================================================================
-- BEFORE (mixed format):
-- {
--   "2": {"start": "10:00", "end": "19:00", "isWorking": true},
--   "3": {"start": "10:00", "end": "19:00", "isWorking": true},
--   "monday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}
-- }
--
-- AFTER (clean format):
-- {
--   "monday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]},
--   "tuesday": {"enabled": true, "blocks": [{"start": "10:00", "end": "19:00"}]},
--   "wednesday": {"enabled": true, "blocks": [{"start": "10:00", "end": "19:00"}]},
--   "thursday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]},
--   "friday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]},
--   "saturday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]},
--   "sunday": {"enabled": false, "blocks": []}
-- }
-- ============================================================================
