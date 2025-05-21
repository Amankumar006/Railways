-- Fix RLS policies for profiles table
-- This migration addresses the issue where users can't create their own profile
-- due to restrictive RLS policies

-- First, let's check if RLS is enabled on the profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true
  ) THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Drop existing policies on the profiles table to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;

-- Create policies for SELECT operations
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Managers can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager'
  )
);

-- Create policy for INSERT operations
-- This is the critical policy that was missing
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create policy for UPDATE operations
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy for DELETE operations (optional, depending on your requirements)
-- Uncomment if you want to allow users to delete their own profile
-- CREATE POLICY "Users can delete their own profile" 
-- ON public.profiles FOR DELETE 
-- USING (auth.uid() = id);
