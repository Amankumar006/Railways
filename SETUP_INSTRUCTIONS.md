# Setup Instructions - Fix 404 Login Error

## Problem
The app is showing a 404 error during login because the Supabase environment variables are not configured.

## Solution
You need to create a `.env` file with your Supabase credentials.

### Step 1: Create .env file
Create a new file called `.env` in the root directory of your project with the following content:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 2: Get your Supabase credentials
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (or create a new one if you don't have one)
3. Go to **Settings** > **API**
4. Copy the **Project URL** and paste it as `EXPO_PUBLIC_SUPABASE_URL`
5. Copy the **anon public** key and paste it as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Example .env file
```
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0ODAwMCwiZXhwIjoxOTUyMTI0MDAwfQ.example_key_here
```

### Step 4: Restart the development server
After creating the .env file, restart your development server:

```bash
npm start
```

## Why this fixes the 404 error
The login functionality uses Supabase for authentication. Without the proper URL and API key, the app cannot connect to your Supabase backend, resulting in 404 errors when trying to authenticate users.

## Additional Setup (if you don't have a Supabase project)
If you don't have a Supabase project yet:

1. Go to https://supabase.com
2. Sign up/Sign in
3. Create a new project
4. Wait for the project to be set up
5. Run the database migrations found in the `supabase/migrations/` folder
6. Follow the steps above to get your credentials 