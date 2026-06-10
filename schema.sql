-- SQL Schema for Kiddy.ai Supabase Database
-- Copy and run this script inside the Supabase SQL Editor (https://database.new)

-- 1. Create users table (matches student and admin profiles)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Maps to Clerk User ID (user.id)
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    dob TEXT,
    gender TEXT,
    college TEXT,
    department TEXT,
    year TEXT,
    city TEXT,
    state TEXT,
    reason TEXT,
    role TEXT DEFAULT 'student',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create announcements table (for bootcamp updates)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create contacts table (for landing page contact messages)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable public access for direct frontend CRUD operations (Bypasses Auth RLS for demo/simplicity)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
