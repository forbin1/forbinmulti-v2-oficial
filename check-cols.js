import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://forbinmulti-v2-oficial.supabase.co"; // fallback from standard config if any
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Or we can just try to query it from public client in src
import { supabase } from './src/integrations/supabase/client.js'; // wait, it's TS, so running a quick JS is easier.
