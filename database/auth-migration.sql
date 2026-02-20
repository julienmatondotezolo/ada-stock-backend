-- Ada Planning Auth Migration
-- Creates user_profiles table and related objects for Supabase Auth integration

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'supervisor', 'staff')),
    restaurant_id VARCHAR(100) DEFAULT 'losteria-deerlijk',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_restaurant_id ON user_profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin users can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Admin users can manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;  
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Create default admin user (will be replaced with signup)
-- This is a placeholder - actual user creation happens via auth API
INSERT INTO user_profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    restaurant_id, 
    is_active
) VALUES (
    'admin-placeholder-uuid',
    'admin@losteria.be',
    'Admin',
    'User', 
    'admin',
    'losteria-deerlijk',
    true
) ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Add comment
COMMENT ON TABLE user_profiles IS 'User profiles for Ada Planning authentication and authorization';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Ada Planning Auth Migration completed successfully!';
    RAISE NOTICE '📋 Created: user_profiles table with RLS policies';
    RAISE NOTICE '🔐 Auth roles: admin, manager, supervisor, staff';
    RAISE NOTICE '🏪 Default restaurant: losteria-deerlijk';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '1. Create your first admin user via /api/v1/auth/signup';
    RAISE NOTICE '2. Update frontend to use authentication';
    RAISE NOTICE '3. Test login/logout flow';
END $$;