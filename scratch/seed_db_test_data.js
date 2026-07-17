const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

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

async function seed() {
  const userEmail = process.argv[2];
  if (!userEmail) {
    console.log('\n📖 Usage: node scratch/seed_db_test_data.js <your_email>');
    console.log('Provide the email of the logged-in user to link them to a test mentor.\n');
    process.exit(0);
  }

  const targetEmail = userEmail.toLowerCase().trim();
  console.log(`🚀 Starting database seeding for user: ${targetEmail}`);

  // 1. Fetch the user's profile
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', targetEmail)
    .single();

  if (userError || !userProfile) {
    console.error(`❌ User profile for email "${targetEmail}" was not found in the database.`);
    console.log('💡 Please sign up/log in to the webapp first to create your profile, then run this script again.');
    process.exit(1);
  }

  console.log(`✅ Found user profile: "${userProfile.full_name}" (ID: ${userProfile.id}, Role: ${userProfile.role})`);

  // 2. Create/get a test mentor
  const mentorEmail = 'test.mentor@navymentor.ng';
  console.log(`🔍 Checking if test mentor "${mentorEmail}" exists...`);
  let { data: mentorProfile, error: mentorError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', mentorEmail)
    .single();

  if (mentorError || !mentorProfile) {
    console.log('➕ Creating a new test mentor profile...');
    const { data: newMentor, error: createMentorError } = await supabase
      .from('profiles')
      .insert({
        email: mentorEmail,
        full_name: 'Captain Jeremiah Cole (Test Mentor)',
        role: 'active_mentor',
        verification_status: 'verified',
        service_number: 'NN/5482',
        service_branch: 'Operations',
        specialization: 'Naval Warfare & Strategy',
        rank: 'Captain',
        years_of_service: 22,
        command_location: 'NHQ Abuja',
        bio: 'This is a test mentor profile seeded for verifying session booking.',
        is_accepting_mentees: true,
        max_mentees: 5
      })
      .select()
      .single();

    if (createMentorError) {
      console.error('❌ Failed to create test mentor profile:', createMentorError.message);
      process.exit(1);
    }
    mentorProfile = newMentor;
    console.log('✅ Created test mentor profile.');
  } else {
    console.log('✅ Test mentor profile already exists.');
  }

  // Determine who is mentee and who is mentor
  let menteeId, mentorId;
  if (userProfile.role === 'active_mentor' || userProfile.role === 'retired_mentor') {
    menteeId = mentorProfile.id; // User is mentor, test account is mentee
    mentorId = userProfile.id;
    console.log(`🔗 Linking user (Mentor) with test account (Mentee)...`);
  } else {
    menteeId = userProfile.id; // User is mentee, test account is mentor
    mentorId = mentorProfile.id;
    console.log(`🔗 Linking user (Mentee) with test account (Mentor)...`);
  }

  // 3. Check if relationship already exists
  const { data: existingRel, error: relCheckError } = await supabase
    .from('mentorship_relationships')
    .select('*')
    .eq('mentee_id', menteeId)
    .eq('mentor_id', mentorId)
    .limit(1);

  if (existingRel && existingRel.length > 0) {
    console.log(`✅ Active mentorship relationship already exists (ID: ${existingRel[0].id}, Status: ${existingRel[0].status}).`);
    console.log('🎉 You are ready to book sessions!');
    process.exit(0);
  }

  // 4. Insert mentorship relationship
  console.log('➕ Creating active mentorship relationship...');
  const { data: newRel, error: createRelError } = await supabase
    .from('mentorship_relationships')
    .insert({
      mentee_id: menteeId,
      mentor_id: mentorId,
      status: 'active',
      started_at: new Date().toISOString(),
      notes: 'Seeded for end-to-end booking verification.'
    })
    .select()
    .single();

  if (createRelError) {
    console.error('❌ Failed to create mentorship relationship:', createRelError.message);
    process.exit(1);
  }

  console.log(`🎉 Mentorship relationship created successfully (ID: ${newRel.id})!`);
  console.log('👉 Refresh your dashboard browser tab. You can now book sessions with "Captain Jeremiah Cole (Test Mentor)".');
}

seed();
