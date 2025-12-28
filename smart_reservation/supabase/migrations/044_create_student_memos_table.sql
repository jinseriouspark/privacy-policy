-- Create student_memos table for storing instructor notes about students
CREATE TABLE IF NOT EXISTS public.student_memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_memos_instructor_id ON public.student_memos(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_memos_student_id ON public.student_memos(student_id);
CREATE INDEX IF NOT EXISTS idx_student_memos_date ON public.student_memos(date DESC);
CREATE INDEX IF NOT EXISTS idx_student_memos_created_at ON public.student_memos(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.student_memos ENABLE ROW LEVEL SECURITY;

-- Policy: Instructors can view their own memos
CREATE POLICY "Instructors can view their own memos"
ON public.student_memos
FOR SELECT
TO authenticated
USING (
    instructor_id IN (
        SELECT id FROM public.users WHERE auth.email() = users.email
    )
);

-- Policy: Instructors can insert their own memos
CREATE POLICY "Instructors can insert their own memos"
ON public.student_memos
FOR INSERT
TO authenticated
WITH CHECK (
    instructor_id IN (
        SELECT id FROM public.users WHERE auth.email() = users.email
    )
);

-- Policy: Instructors can update their own memos
CREATE POLICY "Instructors can update their own memos"
ON public.student_memos
FOR UPDATE
TO authenticated
USING (
    instructor_id IN (
        SELECT id FROM public.users WHERE auth.email() = users.email
    )
)
WITH CHECK (
    instructor_id IN (
        SELECT id FROM public.users WHERE auth.email() = users.email
    )
);

-- Policy: Instructors can delete their own memos
CREATE POLICY "Instructors can delete their own memos"
ON public.student_memos
FOR DELETE
TO authenticated
USING (
    instructor_id IN (
        SELECT id FROM public.users WHERE auth.email() = users.email
    )
);

-- Add comment to the table
COMMENT ON TABLE public.student_memos IS 'Stores instructor notes and memos about students for consultation tracking';
