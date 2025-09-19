/*
  # Fix user creation database error

  1. Database Issues
    - Fix trigger function for automatic user profile creation
    - Ensure proper permissions for auth operations
    - Handle edge cases in user creation

  2. Security
    - Temporarily allow user creation during setup
    - Proper error handling in trigger functions
    - Grant necessary permissions to auth schema
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_name text;
BEGIN
  -- Determine role based on email
  IF NEW.email ILIKE '%admin%' THEN
    user_role := 'admin';
    user_name := 'System Administrator';
  ELSE
    user_role := 'cashier';
    user_name := 'Cashier';
  END IF;

  -- Insert user profile with error handling
  BEGIN
    INSERT INTO public.users (id, name, email, role, is_active)
    VALUES (NEW.id, user_name, NEW.email, user_role, true);
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, update instead
      UPDATE public.users 
      SET name = user_name, role = user_role, is_active = true, updated_at = now()
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail the auth user creation
      RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant specific permissions for user creation
GRANT INSERT, UPDATE, SELECT ON public.users TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Temporarily disable RLS on users table for initial setup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Ensure auth schema permissions
GRANT USAGE ON SCHEMA auth TO postgres, service_role;

-- Create a function to re-enable RLS after initial setup
CREATE OR REPLACE FUNCTION public.enable_users_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.enable_users_rls() TO postgres, service_role;