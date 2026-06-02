// ============================================
// LOGIN WITH SUPABASE AUTHENTICATION
// ============================================

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous errors
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('roleError').textContent = '';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    
    // Get values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.querySelector('input[name="role"]:checked')?.value || '';
    
    let isValid = true;
    
    // Validate email
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        isValid = false;
    } else if (!email.includes('@')) {
        document.getElementById('emailError').textContent = 'Please enter a valid email';
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        isValid = false;
    } else if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    
    // Validate role
    if (!role) {
        document.getElementById('roleError').textContent = 'Please select a role';
        isValid = false;
    }
    
    // If validation fails, show error message
    if (!isValid) {
        const errorMsg = document.getElementById('errorMessage');
        errorMsg.textContent = 'Please fix the errors above';
        errorMsg.style.display = 'block';
        return;
    }
    
    // Disable button during login
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Signing in...</span>';
    loginBtn.style.opacity = '0.6';
    
    try {
        // Check if trying to login as admin with admin email
        const isAdminEmail = email === 'elayen24@gmail.com';
        
        if (isAdminEmail && role !== 'admin') {
            throw new Error('This email is registered as admin. Please select Admin role.');
        }
        
        if (!isAdminEmail && role === 'admin') {
            throw new Error('Only authorized admin accounts can access admin dashboard.');
        }
        
        // Try to sign in first
        let { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        // If user doesn't exist, sign them up
        if (error && error.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        role: role
                    },
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (signUpError) {
                throw signUpError;
            }
            
            // Check if email confirmation is required
            if (signUpData.user && !signUpData.session) {
                throw new Error('Please check your email to confirm your account, then login again.');
            }
            
            data = signUpData;
            
            // Wait a moment for trigger to create user
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (error) {
            throw error;
        }
        
        // Check if user exists in users table and update role if needed
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();
        
        if (userError || !userData) {
            // User doesn't exist in users table, create them manually
            const { error: createError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: email,
                    name: email.split('@')[0],
                    role: role
                })
                .select()
                .single();
            
            if (createError && !createError.message.includes('duplicate')) {
                throw new Error('Database error: ' + createError.message);
            }
        } else {
            // Verify role matches
            if (userData.role !== role) {
                await supabase.auth.signOut();
                throw new Error(`This account is registered as ${userData.role}. Please select ${userData.role} role to login.`);
            }
        }
        
        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        
        // Show success message
        const successMsg = document.getElementById('successMessage');
        successMsg.textContent = 'Login successful! Redirecting...';
        successMsg.style.display = 'block';
        
        // Redirect based on role
        setTimeout(function() {
            if (role === 'employee') {
                window.location.href = 'employee-dashboard.html';
            } else if (role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        const errorMsg = document.getElementById('errorMessage');
        errorMsg.textContent = error.message || 'Login failed. Please try again.';
        errorMsg.style.display = 'block';
        
        // Re-enable button
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span><span class="button-arrow">→</span>';
        loginBtn.style.opacity = '1';
    }
});

// Real-time validation on blur
document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    if (email && !email.includes('@')) {
        document.getElementById('emailError').textContent = 'Please enter a valid email';
    } else {
        document.getElementById('emailError').textContent = '';
    }
});

document.getElementById('password').addEventListener('blur', function() {
    const password = this.value.trim();
    if (password && password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
    } else {
        document.getElementById('passwordError').textContent = '';
    }
});
