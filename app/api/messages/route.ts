import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
import { requireProfile, createNotification } from '@/lib/api-helpers';
import { encrypt, decrypt } from '@/lib/encryption';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const relationshipId = searchParams.get('relationship_id');

    if (!relationshipId) {
      return NextResponse.json({ error: 'Missing relationship_id' }, { status: 400 });
    }

    // 1. Verify the user is part of this relationship
    const { data: rel, error: relError } = await supabase
      .from('mentorship_relationships')
      .select('*')
      .eq('id', relationshipId)
      .single();
    if (relError || !rel) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    if (rel.mentee_id !== profile.id && rel.mentor_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch trailing history (last 50 messages)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (msgError) throw msgError;

    // Fetch related profile details for the message senders
    const senderIds = Array.from(new Set(
      (messages || []).map(m => m.sender_id).filter(Boolean)
    ));

    let profiles: any[] = [];
    if (senderIds.length > 0) {
      const { data: profs, error: profsError } = await supabase
        .from('profiles')
        .select('id, full_name, rank, avatar_url, role')
        .in('id', senderIds);
      if (profsError) throw profsError;
      profiles = profs || [];
    }
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const messagesWithSenders = (messages || []).map((msg: any) => {
      const sender = profileMap.get(msg.sender_id) || null;
      return { ...msg, sender };
    });

    const orderedMessages = messagesWithSenders.reverse();

    // 3. Decrypt message content
    const decryptedMessages = orderedMessages.map(msg => {
      const content = decrypt(msg.encrypted_content, msg.iv, msg.auth_tag);
      return {
        ...msg,
        content,
      };
    });

    return NextResponse.json(decryptedMessages);
  } catch (err: any) {
    console.error('Messages GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { relationship_id, content } = body;

    if (!relationship_id || !content) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Verify the user is part of this relationship
    const { data: rel, error: relError } = await supabase
      .from('mentorship_relationships')
      .select('*')
      .eq('id', relationship_id)
      .single();
    if (relError || !rel) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    if (rel.mentee_id !== profile.id && rel.mentor_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (rel.status === 'ended') {
      return NextResponse.json({ error: 'Cannot send messages on an ended relationship' }, { status: 400 });
    }

    // 2. Encrypt the content
    const { encrypted_content, iv, auth_tag } = encrypt(content);

    // 3. Insert into DB
    const { data: msg, error: msgError } = await supabase
      .from('messages')
      .insert({
        relationship_id,
        sender_id: profile.id,
        encrypted_content,
        iv,
        auth_tag,
      })
      .select()
      .single();
    if (msgError) throw msgError;

    // Fetch sender profile details in JS
    const { data: senderProf, error: senderError } = await supabase
      .from('profiles')
      .select('id, full_name, rank, avatar_url, role')
      .eq('id', profile.id)
      .single();
    if (senderError) throw senderError;

    msg.sender = senderProf;

    // 4. Notify the recipient about the new message
    const recipientId = rel.mentor_id === profile.id ? rel.mentee_id : rel.mentor_id;
    if (recipientId) {
      try {
        await createNotification(
          recipientId,
          'message',
          `New message from ${profile.full_name}`,
          content.length > 60 ? content.slice(0, 60) + '...' : content,
          `/dashboard/messages/${relationship_id}`
        );
      } catch (notifErr) {
        console.error('Failed to create message notification:', notifErr);
      }
    }

    // 5. Return message with decrypted content to matching client expectation
    const responseData = {
      ...msg,
      content,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (err: any) {
    console.error('Messages POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
