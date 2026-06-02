// ============================================
// SUPABASE CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://mptnqghphtqzeqmaoctj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdG5xZ2hwaHRxemVxbWFvY3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODkyNzksImV4cCI6MjA4NjU2NTI3OX0.7ESzrjhsjqdyoFuNM0SWd_xETzmWV-SyCy_0b1pzlhc';

// Initialize Supabase client
try {
    const supabaseLib = window.supabase || window.supabaseJs;
    if (supabaseLib && typeof supabaseLib.createClient === 'function') {
        window.supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        // v2 CDN exposes as supabase namespace
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    console.log('✅ Supabase initialized');
} catch(e) {
    console.error('❌ Supabase init failed:', e);
    alert('Error: Supabase failed to initialize. Please refresh.');
}

// Helper function to get current user
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

// Helper function to check if user is admin
async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    return data?.role === 'admin';
}
