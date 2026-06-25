"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import supabase from '@/lib/supabase';
import { Card, Button, Input, Select, Textarea, Avatar, RoleBadge, VerificationBadge, Spinner, Modal } from '@/components/ui';
import AvailabilityManager from '@/components/AvailabilityManager';
import { Save, Check, Camera, Image as ImageIcon, Trash2, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const branches = ['Engineering', 'Logistics', 'Navigation', 'Operations', 'Communications', 'Medical', 'Administration', 'Intelligence', 'Seamanship', 'Information Technology'];
const ranks = ['Cadet', 'Midshipman', 'Sub Lieutenant', 'Lieutenant', 'Lieutenant Commander', 'Commander', 'Captain', 'Commodore', 'Rear Admiral', 'Vice Admiral', 'Admiral', 'Ordinary Seaman', 'Leading Rating', 'Petty Officer', 'Warrant Officer'];

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<any>({});
  
  // Storage states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (!profile) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const update = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));
  const isMentor = profile.role === 'active_mentor' || profile.role === 'retired_mentor';
  const isRetired = profile.role === 'retired_mentor';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-avatar-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      update('avatar_url', publicUrl);
    } catch (err: any) {
      alert(err.message || 'Error uploading profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingGallery(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-gallery-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-gallery')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-gallery')
        .getPublicUrl(fileName);

      const currentPics = form.additional_pictures || [];
      update('additional_pictures', [...currentPics, publicUrl]);
    } catch (err: any) {
      alert(err.message || 'Error uploading gallery picture');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const currentPics = form.additional_pictures || [];
    update('additional_pictures', currentPics.filter((_: any, i: number) => i !== indexToRemove));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.profiles.update({
        id: form.id,
        full_name: form.full_name,
        service_branch: form.service_branch,
        specialization: form.specialization,
        rank: form.rank,
        years_of_service: parseInt(form.years_of_service) || 0,
        command_location: form.command_location,
        career_goals: form.career_goals,
        mentorship_interests: form.mentorship_interests,
        bio: form.bio,
        avatar_url: form.avatar_url,
        additional_pictures: form.additional_pictures || [],
        is_accepting_mentees: form.is_accepting_mentees,
        max_mentees: parseInt(form.max_mentees) || 5,
        ...(isRetired ? {
          last_rank_held: form.last_rank_held,
          years_served: parseInt(form.years_served) || null,
          years_since_retirement: parseInt(form.years_since_retirement) || null,
          civilian_role: form.civilian_role,
          civilian_industry: form.civilian_industry,
        } : {}),
      });
      await refreshProfile();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-navy-900">My Profile</h1>
        {!editing ? (
          <Button onClick={() => setEditing(true)}><Save className="w-4 h-4" /> Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</Button>
            <Button onClick={handleSave} loading={loading}>{saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}</Button>
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
          <div className="relative group rounded-full overflow-hidden flex-shrink-0 w-20 h-20 shadow-md">
            {uploadingAvatar ? (
              <div className="absolute inset-0 bg-navy-900/60 flex items-center justify-center text-white z-10">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : null}
            <Avatar name={profile.full_name} src={editing ? form.avatar_url : profile.avatar_url} size="xl" />
            {editing && (
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[10px] text-white mt-1 font-semibold">Change</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-navy-900">{profile.full_name}</h2>
            <p className="text-sm text-navy-400">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              <RoleBadge role={profile.role} />
              <VerificationBadge status={profile.verification_status} />
            </div>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Service Number" value={profile.service_number || '—'} />
              <Field label="Service Branch" value={profile.service_branch || '—'} />
              <Field label="Specialization" value={profile.specialization || '—'} />
              <Field label="Rank" value={profile.rank || '—'} />
              <Field label="Years of Service" value={String(profile.years_of_service || 0)} />
              <Field label="Command / Location" value={profile.command_location || '—'} />
              <div className="sm:col-span-2"><Field label="Career Goals" value={profile.career_goals || '—'} /></div>
              <div className="sm:col-span-2"><Field label="Mentorship Interests" value={profile.mentorship_interests || '—'} /></div>
              <div className="sm:col-span-2"><Field label="Bio" value={profile.bio || '—'} /></div>
              {isMentor && <Field label="Accepting Mentees" value={profile.is_accepting_mentees ? 'Yes' : 'No'} />}
              {isMentor && <Field label="Max Mentees" value={String(profile.max_mentees)} />}
              {isRetired && (
                <>
                  <Field label="Last Rank Held" value={profile.last_rank_held || '—'} />
                  <Field label="Years Served" value={String(profile.years_served ?? '—')} />
                  <Field label="Years Since Retirement" value={String(profile.years_since_retirement ?? '—')} />
                  <Field label="Civilian Role" value={profile.civilian_role || '—'} />
                  <Field label="Civilian Industry" value={profile.civilian_industry || '—'} />
                </>
              )}
            </div>

            {/* Profile Gallery Grid (View Mode) */}
            {profile.additional_pictures && profile.additional_pictures.length > 0 && (
              <div className="border-t border-navy-100 pt-6">
                <h3 className="text-sm font-bold text-navy-700 mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-gold-500" /> Career & Service Photos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {profile.additional_pictures.map((url, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative aspect-video rounded-lg overflow-hidden border border-navy-100 shadow-sm cursor-zoom-in"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Full Name" value={form.full_name || ''} onChange={e => update('full_name', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Service Branch" value={form.service_branch || ''} onChange={e => update('service_branch', e.target.value)}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
              <Select label="Rank" value={form.rank || ''} onChange={e => update('rank', e.target.value)}>
                <option value="">Select rank</option>
                {ranks.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Specialization" value={form.specialization || ''} onChange={e => update('specialization', e.target.value)} />
              <Input label="Years of Service" type="number" value={form.years_of_service || ''} onChange={e => update('years_of_service', e.target.value)} />
            </div>
            <Input label="Command / Location" value={form.command_location || ''} onChange={e => update('command_location', e.target.value)} />
            <Textarea label="Career Goals" rows={2} value={form.career_goals || ''} onChange={e => update('career_goals', e.target.value)} />
            <Textarea label="Mentorship Interests" rows={2} value={form.mentorship_interests || ''} onChange={e => update('mentorship_interests', e.target.value)} />
            <Textarea label="Bio" rows={3} value={form.bio || ''} onChange={e => update('bio', e.target.value)} />
            {isMentor && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Accepting Mentees" value={form.is_accepting_mentees ? 'yes' : 'no'} onChange={e => update('is_accepting_mentees', e.target.value === 'yes')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
                <Input label="Max Mentees" type="number" value={form.max_mentees || ''} onChange={e => update('max_mentees', e.target.value)} />
              </div>
            )}
            {isRetired && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Last Rank Held" value={form.last_rank_held || ''} onChange={e => update('last_rank_held', e.target.value)} />
                <Input label="Years Served" type="number" value={form.years_served || ''} onChange={e => update('years_served', e.target.value)} />
                <Input label="Years Since Retirement" type="number" value={form.years_since_retirement || ''} onChange={e => update('years_since_retirement', e.target.value)} />
                <Input label="Civilian Role" value={form.civilian_role || ''} onChange={e => update('civilian_role', e.target.value)} />
                <Input label="Civilian Industry" value={form.civilian_industry || ''} onChange={e => update('civilian_industry', e.target.value)} />
              </div>
            )}

            {/* Profile Gallery Management (Edit Mode) */}
            <div className="border-t border-navy-100 pt-6">
              <h3 className="text-sm font-bold text-navy-700 mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-gold-500" /> Career & Service Photos
              </h3>
              <p className="text-[11px] text-navy-400 mb-4">Upload up to 6 pictures from your military service or post-service career.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(form.additional_pictures || []).map((url: string, idx: number) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-navy-100 shadow-sm group">
                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                {(form.additional_pictures || []).length < 6 && (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-navy-200 rounded-lg aspect-video cursor-pointer hover:bg-navy-50/50 hover:border-navy-300 transition-all select-none">
                    {uploadingGallery ? (
                      <Loader2 className="w-5 h-5 animate-spin text-navy-400" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-navy-400 mb-1" />
                        <span className="text-[10px] text-navy-500 font-semibold">Upload Photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Availability Manager (Mentors only) */}
      {isMentor && !editing && <AvailabilityManager />}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} title="Photo Viewer" size="lg">
          <div className="flex justify-center items-center max-h-[70vh]">
            <img src={selectedImage} alt="Full Preview" className="max-w-full max-h-[65vh] object-contain rounded-md shadow-lg" />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-navy-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-navy-900">{value}</p>
    </div>
  );
}
