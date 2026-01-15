import { supabase } from './supabase';

// =====================================================
// PRAYERS
// =====================================================

export async function getTodayPrayers(userId: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('prayers')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching prayers:', error);
    return null;
  }

  return data || {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };
}

export async function updatePrayer(userId: string, prayer: string, completed: boolean) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Try to update first
  const { data: existing } = await supabase
    .from('prayers')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('prayers')
      .update({ [prayer]: completed })
      .eq('id', existing.id);

    if (error) console.error('Error updating prayer:', error);
  } else {
    // Insert new record
    const { error } = await supabase
      .from('prayers')
      .insert([{
        user_id: userId,
        date: today,
        [prayer]: completed,
      }]);

    if (error) console.error('Error inserting prayer:', error);
  }
}

export async function getWeekPrayers(userId: string) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('prayers')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching week prayers:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// QURAN PROGRESS
// =====================================================

// =====================================================
// QURAN PROGRESS
// =====================================================

export async function getQuranProgress(userId: string, surah: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('quran_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('surah_name', surah)  // Changed from 'surah' to 'surah_name'
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quran progress:', error);
    return null;
  }

  // Map DB columns to expected format
  if (data) {
    return {
      ...data,
      surah: data.surah_name,
      current_page: data.pages_read,
      current_ayah: 0, // Not stored in DB, will be managed locally
      completed: data.completed
    };
  }

  return null;
}

export async function updateQuranProgress(
  userId: string,
  surah: string,
  currentPage: number,
  currentAyah: number,
  completed: boolean,
  targetPages: number = 1 // Default target if not specified
) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let completedToday = completed;

  if (surah === 'baqarah') {
    const dayOfWeek = new Date().getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert: Saturday(6)=1, Sunday(0)=2, Monday(1)=3, ..., Friday(5)=7
    const todayPage = dayOfWeek === 6 ? 1 : dayOfWeek + 2;
    // Mark as completed ONLY if user finished today's page
    completedToday = currentPage >= todayPage && completed;
  } else if (surah === 'mulk') {
    targetPages = 1;
  } else if (surah === 'kahf') {
    targetPages = 1;
  }

  // Try to get existing
  const { data: existing } = await supabase
    .from('quran_readings')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('surah_name', surah)
    .single();

  if (existing) {
    // Update - removed current_ayah (not in DB)
    const { error } = await supabase
      .from('quran_readings')
      .update({
        pages_read: currentPage,
        completed: completedToday,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) console.error('Error updating quran progress:', error);
  } else {
    // Insert - removed current_ayah (not in DB)
    const { error } = await supabase
      .from('quran_readings')
      .insert([{
        user_id: userId,
        date: today,
        surah_name: surah,
        pages_read: currentPage,
        target_pages: targetPages,
        completed: completedToday,
      }]);

    if (error) console.error('Error inserting quran progress:', error);
  }
}

export async function getTodayQuranProgress(userId: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('quran_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today);

  if (error) {
    console.error('Error fetching today quran progress:', error);
    return [];
  }

  // Map DB columns to expected format
  return (data || []).map(item => ({
    ...item,
    surah: item.surah_name,
    current_page: item.pages_read,
    current_ayah: 0,
  }));
}

export async function getWeekQuranProgress(userId: string) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('quran_readings')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching week quran:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// ATHKAR PROGRESS
// =====================================================

export async function getAthkarProgress(userId: string, type: 'morning' | 'evening') {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('athkar')  // Changed from 'athkar_progress'
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('type', type)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching athkar progress:', error);
    return null;
  }

  return data;
}

export async function updateAthkarProgress(userId: string, type: 'morning' | 'evening', completed: boolean) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Try to get existing
  const { data: existing } = await supabase
    .from('athkar')  // Changed from 'athkar_progress'
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('type', type)
    .single();

  if (existing) {
    // Update
    const { error } = await supabase
      .from('athkar')  // Changed from 'athkar_progress'
      .update({ completed })
      .eq('id', existing.id);

    if (error) console.error('Error updating athkar progress:', error);
  } else {
    // Insert
    const { error } = await supabase
      .from('athkar')  // Changed from 'athkar_progress'
      .insert([{
        user_id: userId,
        date: today,
        type,
        completed,
      }]);

    if (error) console.error('Error inserting athkar progress:', error);
  }
}

export async function getTodayAthkarProgress(userId: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('athkar')  // Changed from 'athkar_progress'
    .select('*')
    .eq('user_id', userId)
    .eq('date', today);

  if (error) {
    console.error('Error fetching today athkar progress:', error);
    return [];
  }

  return data || [];
}

export async function getWeekAthkarProgress(userId: string) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('athkar')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching week athkar:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// PODCAST PROGRESS (TO BE IMPLEMENTED LATER)
// =====================================================

export async function getWeekPodcastProgress(userId: string) {
  // Podcast progress table not yet created - return null for now
  return null;
}

export async function updatePodcastProgress(userId: string, progress: number) {
  // Podcast progress table not yet created - do nothing for now
  console.log('Podcast progress will be saved later when table is created');
}

// =====================================================
// DUAAS
// =====================================================

export async function getUserDuaas(userId: string) {
  const { data, error } = await supabase
    .from('duaas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching duaas:', error);
    return [];
  }

  return data || [];
}

export async function getSharedDuaas(userId: string) {
  const { data, error } = await supabase
    .from('duaas')
    .select('*')
    .eq('partner_id', userId)  // Changed from 'shared_with_user_id'
    .eq('is_shared', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shared duaas:', error);
    return [];
  }

  return data || [];
}

export async function addDuaa(
  userId: string,
  content: string,
  category: 'personal' | 'partner_request' | 'partner_shared',
  isShared: boolean = false,
  sharedWithUserId?: string
) {
  const { error } = await supabase
    .from('duaas')
    .insert([{
      user_id: userId,
      content,
      category,
      is_shared: isShared,
      partner_id: sharedWithUserId,  // Changed from 'shared_with_user_id'
    }]);

  if (error) console.error('Error adding duaa:', error);
}

export async function deleteDuaa(duaaId: string) {
  const { error } = await supabase
    .from('duaas')
    .delete()
    .eq('id', duaaId);

  if (error) console.error('Error deleting duaa:', error);
}

// =====================================================
// USERS & PARTNER
// =====================================================

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function getUserByPartnerCode(partnerCode: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('partner_code', partnerCode)
    .single();

  if (error) {
    console.error('Error fetching user by partner code:', error);
    return null;
  }

  return data;
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user by id:', error);
    return null;
  }

  return data;
}

export async function linkPartner(userId: string, partnerId: string) {
  const { error } = await supabase
    .from('users')
    .update({ partner_id: partnerId })
    .eq('id', userId);

  if (error) console.error('Error linking partner:', error);
}

export async function unlinkPartner(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ partner_id: null })
    .eq('id', userId);

  if (error) console.error('Error unlinking partner:', error);
}

export async function getPartner(userId: string) {
  const user = await getUserById(userId);
  if (!user || !user.partner_id) return null;

  return await getUserById(user.partner_id);
}

// =====================================================
// PARTNER PROGRESS
// =====================================================

export async function getPartnerProgress(partnerId: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Get all progress for today
  const [prayers, quran, athkar, podcast] = await Promise.all([
    getTodayPrayers(partnerId),
    getTodayQuranProgress(partnerId),
    getTodayAthkarProgress(partnerId),
    getWeekPodcastProgress(partnerId),
  ]);

  return {
    prayers,
    quran,
    athkar,
    podcast,
  };
}

// =====================================================
// GIFT REACTIONS
// =====================================================

export type ReactionType = 'like' | 'love' | 'fire' | 'star' | 'pray' | null;

export async function addReactionToGift(giftId: string, reaction: ReactionType) {
  const { data, error } = await supabase
    .from('gifts')
    .update({
      reaction,
      reacted_at: reaction ? new Date().toISOString() : null
    })
    .eq('id', giftId)
    .select()
    .single();

  if (error) {
    console.error('Error adding reaction:', error);
    return null;
  }

  return data;
}

export async function getGiftReaction(giftId: string) {
  const { data, error } = await supabase
    .from('gifts')
    .select('reaction, reacted_at')
    .eq('id', giftId)
    .single();

  if (error) {
    console.error('Error fetching reaction:', error);
    return null;
  }

  return data;
}

// =====================================================
// QURAN BOOKMARKS & KHATMA
// =====================================================

export async function saveQuranBookmark(userId: string, surahNum: number, surahName: string, ayahNum: number) {
  const { error } = await supabase
    .from('quran_bookmarks')
    .upsert({
      user_id: userId,
      surah_number: surahNum,
      surah_name: surahName,
      ayah_number: ayahNum,
      updated_at: new Date().toISOString()
    });

  if (error) console.error('Error saving bookmark:', error);
  return !error;
}

export async function getQuranBookmark(userId: string) {
  const { data, error } = await supabase
    .from('quran_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting bookmark:', error);
    return null;
  }
  return data;
}

export async function getActiveKhatma(userId: string) {
  const { data, error } = await supabase
    .from('quran_khatmas')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('is_current', true)
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data;
}

export async function createNewKhatma(userId: string, targetDays: number = 30) {
  // First, archive any old active khatmas
  await supabase.from('quran_khatmas')
    .update({ status: 'archived', is_current: false })
    .eq('user_id', userId)
    .eq('status', 'active');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + targetDays);

  const { data, error } = await supabase
    .from('quran_khatmas')
    .insert([{
      user_id: userId,
      status: 'active',
      current_surah: 1,
      current_ayah: 1,
      is_current: true,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }])
    .select()
    .single();

  if (error) console.error('Error creating khatma:', error);
  return data;
}

export async function updateKhatmaProgress(khatmaId: string, surahNum: number, ayahNum: number) {
  const { error } = await supabase
    .from('quran_khatmas')
    .update({
      current_surah: surahNum,
      current_ayah: ayahNum
    })
    .eq('id', khatmaId);

  if (error) console.error('Update khatma error:', error);
}

// =====================================================
// USER STREAK & LOGINS
// =====================================================

export async function updateUserStreak(userId: string) {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('streak_count, last_login, streak_updated_at')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let lastUpdateDate = null;
    if (user.streak_updated_at) {
      const lu = new Date(user.streak_updated_at);
      lastUpdateDate = new Date(lu.getFullYear(), lu.getMonth(), lu.getDate());
    }

    let newStreak = user.streak_count || 0;

    // Check if streak should be updated
    if (!lastUpdateDate || today.getTime() > lastUpdateDate.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastUpdateDate && lastUpdateDate.getTime() === yesterday.getTime()) {
        // Consecutive day
        newStreak += 1;
      } else {
        // Streak broken or first time
        newStreak = 1;
      }

      await supabase
        .from('users')
        .update({
          streak_count: newStreak,
          streak_updated_at: now.toISOString(),
          last_login: now.toISOString()
        })
        .eq('id', userId);
    } else {
      // Just update last login
      await supabase
        .from('users')
        .update({ last_login: now.toISOString() })
        .eq('id', userId);
    }

    return newStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return null;
  }
}