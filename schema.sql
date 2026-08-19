-- ==========================================================================
-- ROBOFEST 2.0 OBSTACLE RACE — SUPABASE DATABASE SCHEMA
-- Copy and paste this script into your Supabase SQL Editor and click RUN!
-- ==========================================================================

-- 1. Create Teams & Participants Table
CREATE TABLE IF NOT EXISTS public.teams (
    bot_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    arena VARCHAR(10),
    members TEXT,
    attendance_status VARCHAR(50) DEFAULT 'Absent',
    tech_check_passed BOOLEAN DEFAULT FALSE,
    round1_final_ms BIGINT,
    round2_final_ms BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Master Judging State Table
CREATE TABLE IF NOT EXISTS public.judging_portal_state (
    id VARCHAR(100) PRIMARY KEY,
    state_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Public Access & Realtime Replication
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judging_portal_state ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & public read/write access for matchday judge devices
CREATE POLICY "Allow public read/write on teams" 
ON public.teams FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public read/write on judging_portal_state" 
ON public.judging_portal_state FOR ALL 
USING (true) 
WITH CHECK (true);

-- Enable Realtime broadcasting for live judge sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.judging_portal_state;
