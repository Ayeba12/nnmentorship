import { MockDatabase } from '../domain/MockDatabase.js';
import supabaseProxy from '../lib/supabase.js';

// We import the default export from supabase, which is the proxy
const supabase = supabaseProxy;

async function testMockBooking() {
  console.log('🧪 Starting mock session booking integration test...\n');

  // Initialize mock DB
  MockDatabase.initialize();

  // Force failover mock mode
  // @ts-ignore
  supabase.useMock = true;

  // 1. Get initial relationships (pairs)
  const { data: rels, error: relsError } = await supabase
    .from('mentorship_relationships')
    .select('*');

  if (relsError) {
    console.error('❌ Failed to fetch mentorship relationships:', relsError.message);
    process.exit(1);
  }

  console.log(`✅ Fetched mentorship relationships. Found: ${rels.length} relationships.`);
  if (rels.length === 0) {
    console.error('❌ Test requires at least one mock relationship.');
    process.exit(1);
  }

  const targetRel = rels[0];
  console.log(`ℹ️ Selected relationship for booking test (ID: ${targetRel.id})`);

  // 2. Book a session
  console.log('\n➕ Booking a new session...');
  const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
  const agenda = 'Discuss diesel engine auxiliary load balancing protocols';
  
  const { data: newSession, error: insertError } = await supabase
    .from('sessions')
    .insert({
      relationship_id: targetRel.id,
      scheduled_at: scheduledTime,
      duration_minutes: 60,
      session_type: 'booked_slot',
      status: 'scheduled',
      notes: `Agenda: ${agenda}`
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to insert session:', insertError.message);
    process.exit(1);
  }

  console.log('✅ Session created successfully in mock database!');
  console.log('Generated Session Details:', {
    id: newSession.id,
    relationship_id: newSession.relationship_id,
    scheduled_at: newSession.scheduled_at,
    duration_minutes: newSession.duration_minutes,
    notes: newSession.notes,
    status: newSession.status
  });

  // 3. Query all sessions and check if the new session is present
  console.log('\n🔍 Fetching all sessions to verify persistence...');
  const { data: sessions, error: selectError } = await supabase
    .from('sessions')
    .select('*')
    .eq('relationship_id', targetRel.id);

  if (selectError) {
    console.error('❌ Failed to fetch sessions:', selectError.message);
    process.exit(1);
  }

  const found = sessions.find(s => s.id === newSession.id);
  if (!found) {
    console.error('❌ Created session was not found in the sessions query result!');
    process.exit(1);
  }

  console.log('✅ Found seeded session in query results!');
  console.log('Persisted Session fields verified:', {
    id: found.id,
    notes: found.notes,
    duration: found.duration_minutes,
    type: found.session_type
  });

  // 4. Test updating the session notes (logging/completing session)
  console.log('\n✏️ Updating session status and adding progress notes...');
  const { data: updatedSession, error: updateError } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      notes: 'Session successfully held. Reviewed load balancing.',
      goals_set: 'Master generator procedures',
      progress_recorded: 'Mentees successfully balanced the combat loads.',
      completed_at: new Date().toISOString()
    })
    .eq('id', newSession.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Failed to update session:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Session updated successfully!');
  console.log('Updated Session Details:', {
    id: updatedSession.id,
    status: updatedSession.status,
    notes: updatedSession.notes,
    goals_set: updatedSession.goals_set,
    progress_recorded: updatedSession.progress_recorded,
    completed_at: updatedSession.completed_at
  });

  console.log('\n🎉 All mock session booking integration tests passed successfully!');
}

testMockBooking();
