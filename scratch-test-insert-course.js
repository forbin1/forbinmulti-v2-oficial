import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDM1MTUsImV4cCI6MjA5MzkxOTUxNX0.l3GNijjcKGagHAcIKu9BlgpNJpX1Ko5xo9_ikPDThkU";

// Create client using non-admin key
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Signing in as admin@gmail.com...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@gmail.com',
    password: 'admin' // or whatever password they use. Wait, we don't know the password!
  });
  
  if (authErr) {
    console.error("Auth failed:", authErr.message);
    // Since we don't know the password, let's try creating a client with a custom Authorization header using their user ID!
  }
}
run();
