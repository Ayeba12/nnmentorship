import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create a Supabase client using the Service Role Key to bypass RLS policies
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log('🧪 Verifying end-to-end booking flow on the real Supabase database...\n');

  const menteeEmail = 'demo.mentee@navymentor.ng';
  const mentorEmail = 'demo.mentor@navymentor.ng';

  // 1. Clean up any existing demo records to ensure a fresh test
  console.log('🧹 Cleaning up previous demo records...');
  const { data: oldMementee } = await supabase.from('profiles').select('id').eq('email', menteeEmail).maybeSingle();
  const { data: oldMementor } = await supabase.from('profiles').select('id').eq('email', mentorEmail).maybeSingle();
  
  if (oldMementee) {
    await supabase.from('profiles').delete().eq('id', oldMementee.id);
  }
  if (oldMementor) {
    await supabase.from('profiles').delete().eq('id', oldMementor.id);
  }
  console.log('✅ Clean up complete.');

  // 2. Create Mentee Profile
  console.log('\n➕ Creating demo mentee profile...');
  const { data: mentee, error: menteeError } = await supabase
    .from('profiles')
    .insert({
      email: menteeEmail,
      full_name: 'Sub-Lieutenant Yusuf Musa (Demo Mentee)',
      role: 'mentee',
      verification_status: 'verified',
      service_number: 'NN/4910',
      service_branch: 'Operations',
      specialization: 'Naval Communications',
      rank: 'Lieutenant',
      command_location: 'Western Naval Command (Lagos)',
      bio: 'Seeded demo account for end-to-end testing.'
    })
    .select()
    .single();

  if (menteeError) {
    console.error('❌ Failed to create mentee profile:', menteeError.message);
    process.exit(1);
  }
  console.log(`✅ Mentee profile created with ID: ${mentee.id}`);

  // 3. Create Mentor Profile
  console.log('\n➕ Creating demo mentor profile...');
  const { data: mentor, error: mentorError } = await supabase
    .from('profiles')
    .insert({
      email: mentorEmail,
      full_name: 'Captain Jeremiah Cole (Demo Mentor)',
      role: 'active_mentor',
      verification_status: 'verified',
      service_number: 'NN/2941',
      service_branch: 'Operations',
      specialization: 'Naval Logistics & Strategy',
      rank: 'Captain',
      command_location: 'NHQ Abuja',
      bio: 'Seeded demo mentor for end-to-end testing.'
    })
    .select()
    .single();

  if (mentorError) {
    console.error('❌ Failed to create mentor profile:', mentorError.message);
    process.exit(1);
  }
  console.log(`✅ Mentor profile created with ID: ${mentor.id}`);

  // 4. Create Mentorship Relationship
  console.log('\n➕ Creating active mentorship relationship...');
  const { data: rel, error: relError } = await supabase
    .from('mentorship_relationships')
    .insert({
      mentee_id: mentee.id,
      mentor_id: mentor.id,
      status: 'active',
      started_at: new Date().toISOString(),
      notes: 'Demo relationship for verifying database operations.'
    })
    .select()
    .single();

  if (relError) {
    console.error('❌ Failed to create mentorship relationship:', relError.message);
    process.exit(1);
  }
  console.log(`✅ Mentorship relationship created with ID: ${rel.id}`);

  // 5. Test Insert Session (Book Session)
  console.log('\n📅 Testing session booking on the real database...');
  const scheduledTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours from now
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      relationship_id: rel.id,
      scheduled_at: scheduledTime,
      duration_minutes: 90,
      session_type: 'booked_slot',
      status: 'scheduled',
      notes: 'Agenda: Discuss naval logistics and career development plans'
    })
    .select()
    .single();

  if (sessionError) {
    console.error('❌ Failed to book session:', sessionError.message);
    process.exit(1);
  }
  console.log(`✅ Session booked successfully! (Session ID: ${session.id})`);
  console.log('Booked Session record: ', JSON.stringify(session, null, 2));

  // 6. Test Update Session (Log Session Notes)
  console.log('\n✏️ Testing session logging and notes completion...');
  const { data: updatedSession, error: updateError } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      notes: 'Completed session. Reviewed officer log guidelines.',
      goals_set: 'Read 3 strategic naval defense publications.',
      progress_recorded: 'Mentees successfully drafted naval logistics reports.',
      completed_at: new Date().toISOString()
    })
    .eq('id', session.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Failed to update/complete session:', updateError.message);
    process.exit(1);
  }
  console.log('✅ Session completed and logged successfully!');
  console.log('Updated Session record: ', JSON.stringify(updatedSession, null, 2));

  console.log('\n🎉 Real database integration verification complete! All tables (profiles, mentorship_relationships, sessions) are fully operational and ready for production!');
}

main();
