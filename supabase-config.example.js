// ============================================
// SUPABASE CONFIGURATION
// ============================================
// Copy this file to 'supabase-config.js' and add your credentials

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase library is loaded
if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase library not loaded!');
    alert('Error: Supabase library failed to load. Please refresh the page.');
} else {
    // Initialize Supabase client
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
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
