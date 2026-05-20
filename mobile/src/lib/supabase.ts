import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fewbqcbzlmanmidvrxhs.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZld2JxY2J6bG1hbm1pZHZyeGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTkyNDAsImV4cCI6MjA5MzUzNTI0MH0.UnLqDjHSG4NwDOYmKfBW55uruEQeL6q_cijrddFQDYM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
