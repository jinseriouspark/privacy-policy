# DBA Review Report
**Date**: 2025-12-26
**Reviewer**: Senior Database Administrator (15+ years PostgreSQL/Supabase experience)
**Project**: Smart Reservation - Student API & Database Design

---

## 🚨 Critical Issues

### 1. **Missing Timezone Handling for User-Facing Times**
**Problem**: Using `TIMESTAMPTZ` is good, but you need a user's timezone stored to display times correctly.

```sql
-- Add to users table
ALTER TABLE users
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- Or add to student-specific table if it exists
ALTER TABLE students
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
```

**Impact**: Without this, a student in Seoul sees "2025-01-15 09:00 UTC" instead of "2025-01-15 18:00 KST".

---

### 2. **No Unique Constraint on Reservation Time Slots**
**Problem**: Two students can book the same instructor at the same time.

```sql
-- Prevent double-booking
CREATE UNIQUE INDEX idx_no_instructor_overlap ON reservations (
  instructor_id,
  start_time
) WHERE status NOT IN ('cancelled', 'no_show');

-- Also need exclusion constraint for overlapping ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservations
ADD CONSTRAINT no_instructor_overlap
EXCLUDE USING GIST (
  instructor_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status NOT IN ('cancelled', 'no_show'));
```

**Why both?**: The unique index is fast for exact matches. The exclusion constraint prevents partial overlaps (e.g., 9:00-10:00 and 9:30-10:30).

---

### 3. **Package Credit Deduction is Vulnerable to Race Conditions**
**Problem**: Two simultaneous bookings can use the same credit.

```sql
-- Add optimistic locking to student_packages
ALTER TABLE student_packages
ADD COLUMN version INT DEFAULT 0;

-- Your app must use:
UPDATE student_packages
SET credits_remaining = credits_remaining - 1,
    version = version + 1,
    updated_at = NOW()
WHERE id = $1
  AND version = $2
  AND credits_remaining >= 1
RETURNING *;

-- If no rows returned, credit was already used (retry the transaction)
```

**Alternative**: Use PostgreSQL's `SELECT ... FOR UPDATE` in a transaction:

```sql
BEGIN;
  SELECT credits_remaining
  FROM student_packages
  WHERE id = $1
  FOR UPDATE; -- Locks the row

  -- Check if credits_remaining > 0, then:
  UPDATE student_packages
  SET credits_remaining = credits_remaining - 1
  WHERE id = $1;

  INSERT INTO reservations (...) VALUES (...);
COMMIT;
```

---

### 4. **Missing Cascade Delete Rules**
**Problem**: Deleting a user leaves orphaned reservations.

```sql
ALTER TABLE reservations
DROP CONSTRAINT reservations_student_id_fkey,
ADD CONSTRAINT reservations_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE reservations
DROP CONSTRAINT reservations_instructor_id_fkey,
ADD CONSTRAINT reservations_instructor_id_fkey
  FOREIGN KEY (instructor_id) REFERENCES users(id)
  ON DELETE SET NULL; -- Keep reservation history even if instructor leaves

-- For notifications
ALTER TABLE notifications
DROP CONSTRAINT notifications_user_id_fkey,
ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;

-- For package_usage_history
ALTER TABLE package_usage_history
DROP CONSTRAINT package_usage_history_package_id_fkey,
ADD CONSTRAINT package_usage_history_package_id_fkey
  FOREIGN KEY (package_id) REFERENCES student_packages(id)
  ON DELETE CASCADE;

ALTER TABLE package_usage_history
DROP CONSTRAINT package_usage_history_reservation_id_fkey,
ADD CONSTRAINT package_usage_history_reservation_id_fkey
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
  ON DELETE SET NULL; -- Keep usage history even if reservation deleted
```

---

### 5. **No Row Level Security (RLS) Policies**
**Problem**: Any authenticated user can read/modify any data.

```sql
-- Enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

-- Example policies for reservations
CREATE POLICY "Students can view their own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view their assigned reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = instructor_id);

CREATE POLICY "Students can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can cancel their own reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (
    -- Only allow updating status and cancellation fields
    (OLD.student_id = NEW.student_id) AND
    (OLD.instructor_id = NEW.instructor_id) AND
    (OLD.start_time = NEW.start_time)
  );

-- Similar policies for other tables
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## ⚠️ Important Improvements

### 6. **Missing Indexes for Common Queries**

```sql
-- For GET /api/reservations/student/:studentId
CREATE INDEX idx_reservations_student_id ON reservations(student_id);

-- For GET /api/reservations/today/:studentId
CREATE INDEX idx_reservations_student_date ON reservations(
  student_id,
  start_time
) WHERE status NOT IN ('cancelled');

-- For GET /api/availability/:instructorId (find gaps in schedule)
CREATE INDEX idx_reservations_instructor_time ON reservations(
  instructor_id,
  start_time,
  end_time
) WHERE status NOT IN ('cancelled', 'no_show');

-- For GET /api/notifications/student/:studentId (unread first)
CREATE INDEX idx_notifications_user_unread ON notifications(
  user_id,
  created_at DESC
) WHERE read = FALSE;

-- For package lookups
CREATE INDEX idx_student_packages_student_id ON student_packages(student_id);
CREATE INDEX idx_student_packages_valid ON student_packages(
  student_id,
  valid_until
) WHERE status = 'active' AND credits_remaining > 0;

-- For usage history
CREATE INDEX idx_package_usage_history_package ON package_usage_history(
  package_id,
  used_at DESC
);
```

---

### 7. **Reservation Status Should Be an ENUM**
**Problem**: String typos cause bugs ("confirmd" vs "confirmed").

```sql
CREATE TYPE reservation_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

ALTER TABLE reservations
ALTER COLUMN status TYPE reservation_status
USING status::reservation_status;

-- Same for attendance_status
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'late',
  'excused'
);

ALTER TABLE reservations
ALTER COLUMN attendance_status TYPE attendance_status
USING attendance_status::attendance_status;
```

---

### 8. **Missing Soft Delete for Reservations**
**Problem**: Hard deletes lose audit trail. Add soft delete for compliance.

```sql
ALTER TABLE reservations
ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update queries to exclude deleted
CREATE INDEX idx_reservations_active ON reservations(student_id)
WHERE deleted_at IS NULL;

-- RLS policies should also filter deleted_at IS NULL
```

---

### 9. **Package Expiration Check is Missing**
**Problem**: Students can book with expired packages.

```sql
-- Use a trigger
CREATE OR REPLACE FUNCTION check_package_validity()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM student_packages
    WHERE id = NEW.package_id
      AND (valid_until < NEW.start_time OR credits_remaining < 1)
  ) THEN
    RAISE EXCEPTION 'Package is expired or has no credits';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_package_before_reservation
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION check_package_validity();
```

---

### 10. **Missing `updated_at` Trigger**
**Problem**: `updated_at` won't auto-update on changes.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply to other tables with updated_at
CREATE TRIGGER update_student_packages_updated_at
BEFORE UPDATE ON student_packages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### 11. **No Idempotency Key for Reservations**
**Problem**: Double-click = double booking.

```sql
ALTER TABLE reservations
ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;

CREATE INDEX idx_reservations_idempotency ON reservations(idempotency_key);

-- Client sends UUID with each request
-- Server checks if idempotency_key exists before creating
```

---

### 12. **Missing Table: `reservation_reminders`**
**Reason**: You'll want to send notifications 24h/1h before class. Track reminder status.

```sql
CREATE TABLE reservation_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL, -- '24_hours', '1_hour', '15_minutes'
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_scheduled ON reservation_reminders(
  scheduled_at
) WHERE status = 'pending';
```

---

## 💡 Optimization Suggestions

### 13. **Materialized View for Instructor Availability**
**Use Case**: `GET /api/availability/:instructorId` queries are complex (find gaps between reservations).

```sql
CREATE MATERIALIZED VIEW instructor_availability AS
SELECT
  i.id AS instructor_id,
  i.name,
  c.id AS coaching_id,
  generate_series(
    date_trunc('day', NOW()),
    date_trunc('day', NOW() + INTERVAL '30 days'),
    INTERVAL '30 minutes'
  ) AS time_slot,
  NOT EXISTS (
    SELECT 1
    FROM reservations r
    WHERE r.instructor_id = i.id
      AND r.start_time <= generate_series.time_slot
      AND r.end_time > generate_series.time_slot
      AND r.status NOT IN ('cancelled', 'no_show')
  ) AS is_available
FROM users i
CROSS JOIN coachings c
WHERE i.user_type = 'instructor';

CREATE INDEX idx_availability_lookup ON instructor_availability(
  instructor_id,
  coaching_id,
  time_slot
) WHERE is_available = TRUE;

-- Refresh every 5 minutes via cron job
REFRESH MATERIALIZED VIEW CONCURRENTLY instructor_availability;
```

---

### 14. **Stored Procedure for Fast Availability Lookup**

```sql
CREATE OR REPLACE FUNCTION get_available_slots(
  p_instructor_id UUID,
  p_date DATE
) RETURNS TABLE(time_slot TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  WITH time_grid AS (
    SELECT generate_series(
      p_date::TIMESTAMPTZ,
      (p_date + INTERVAL '1 day')::TIMESTAMPTZ,
      INTERVAL '30 minutes'
    ) AS slot
  )
  SELECT tg.slot
  FROM time_grid tg
  LEFT JOIN reservations r ON (
    r.instructor_id = p_instructor_id
    AND r.start_time <= tg.slot
    AND r.end_time > tg.slot
    AND r.status NOT IN ('cancelled', 'no_show')
  )
  WHERE r.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM get_available_slots('instructor-uuid', '2025-01-15');
```

---

## 📋 Missing Tables You Should Add

### 15. **`instructor_availability_rules`**
**Why**: Instructors need to set "I'm available Mon-Fri 9am-5pm".

```sql
CREATE TABLE instructor_availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_rules_instructor ON instructor_availability_rules(
  instructor_id,
  day_of_week
) WHERE is_active = TRUE;
```

---

### 16. **`instructor_time_off`**
**Why**: Instructors need to block vacation days.

```sql
CREATE TABLE instructor_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

CREATE INDEX idx_time_off_instructor ON instructor_time_off(
  instructor_id,
  start_date,
  end_date
);
```

---

### 17. **`audit_log`**
**Why**: Track who changed what (GDPR/compliance requirement).

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(changed_by, changed_at DESC);
```

---

## ✅ Looks Good

1. **Using UUIDs**: Good for distributed systems and prevents enumeration attacks.
2. **TIMESTAMPTZ**: Correct choice for multi-timezone app.
3. **`package_usage_history` table**: Excellent audit trail for credits.
4. **`notifications.data` JSONB**: Flexible for different notification types.
5. **Separate `cancellation_reason` and `cancelled_at`**: Good for analytics.
6. **`no_overlap` CHECK constraint**: Prevents invalid time ranges.

---

## 📊 Implementation Checklist

| Issue | Priority | Status |
|-------|----------|--------|
| Add timezone to users | 🚨 Critical | ❌ Missing |
| Prevent double-booking | 🚨 Critical | ❌ Missing |
| Fix race condition on credits | 🚨 Critical | ❌ Missing |
| Add cascade delete rules | 🚨 Critical | ❌ Missing |
| Enable RLS policies | 🚨 Critical | ❌ Missing |
| Add indexes | ⚠️ Important | ❌ Missing |
| Use ENUMs for status | ⚠️ Important | ❌ Missing |
| Add soft delete | ⚠️ Important | ❌ Missing |
| Package expiration trigger | ⚠️ Important | ❌ Missing |
| Auto-update `updated_at` | ⚠️ Important | ❌ Missing |
| Add idempotency key | ⚠️ Important | ❌ Missing |
| Add `reservation_reminders` | ⚠️ Important | ❌ Missing |
| Add `instructor_availability_rules` | ⚠️ Important | ❌ Missing |
| Add `instructor_time_off` | ⚠️ Important | ❌ Missing |
| Materialized view for availability | 💡 Optional | ❌ Missing |
| Audit log table | 💡 Optional | ❌ Missing |

---

## 🚀 Recommended Implementation Order

### Phase 1: Security & Data Integrity (Day 1)
1. Enable RLS policies on all tables
2. Add cascade delete rules
3. Add timezone column to users

### Phase 2: Prevent Critical Bugs (Day 1-2)
4. Add double-booking prevention (exclusion constraint)
5. Fix race condition (optimistic locking or FOR UPDATE)
6. Add package expiration validation trigger

### Phase 3: Performance (Day 2-3)
7. Add all missing indexes
8. Add ENUMs for status fields
9. Add updated_at triggers

### Phase 4: Features (Day 3-4)
10. Add idempotency key
11. Add soft delete support
12. Create reservation_reminders table
13. Create instructor_availability_rules table
14. Create instructor_time_off table

### Phase 5: Advanced (Week 2+)
15. Implement materialized view (if needed)
16. Add audit_log table (if needed)
17. Set up archival strategy

---

## 📝 Next Steps

1. Review this report with your team
2. Create Supabase migration files
3. Test migrations in staging environment
4. Monitor query performance after deployment
5. Set up pg_stat_statements for ongoing monitoring

**Would you like me to generate the complete SQL migration script?**
