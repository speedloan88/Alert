import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://swnshjqydlazsqymchew.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bnNoanF5ZGxhenNxeW1jaGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTcwMTEsImV4cCI6MjA5ODI5MzAxMX0.hXadSj75dBRNsKz8IuORzQSN5hqu2c4oO97Ddimt-Y4'
);
