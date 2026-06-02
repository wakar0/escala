// ============================================
// EMPLOYEE DASHBOARD WITH SUPABASE
// ============================================

// Profile dropdown toggle - MUST BE GLOBAL
window.toggleProfileDropdown = function() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set personalized greeting
    const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();
    
    const displayName = userData?.name || user.email.split('@')[0];
    const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    document.getElementById('userGreeting').textContent = 'Hello, ' + capitalizedName;
    
    try {
        // Fetch tickets for current user from Supabase
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('created_by', user.id)
            .order('created_date', { ascending: false });
        
        if (error) throw error;
        
        // Calculate counts
        const totalCount = tickets.length;
        const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
        const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        
        // Update dashboard cards
        document.querySelectorAll('.card')[0].querySelector('.number').textContent = totalCount;
        document.querySelectorAll('.card')[1].querySelector('.number').textContent = openCount;
        document.querySelectorAll('.card')[2].querySelector('.number').textContent = resolvedCount;
        
        // Display recent tickets
        const recentTickets = tickets.slice(0, 5);
        const recentContainer = document.getElementById('recentTickets');
        
        if (recentTickets.length === 0) {
            recentContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No recent tickets</p>';
        } else {
            recentContainer.innerHTML = '';
            recentTickets.forEach(ticket => {
                const ticketDiv = document.createElement('div');
                ticketDiv.className = 'recent-ticket-item';
                ticketDiv.onclick = function() {
                    localStorage.setItem('selectedTicket', ticket.id);
                    window.location.href = 'employee-ticket-detail.html';
                };
                
                const statusClass = 'status-' + ticket.status.replace('-', '');
                const priorityClass = 'priority-' + ticket.priority;
                
                ticketDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>#${ticket.id.toString().padStart(3, '0')}</strong> - ${ticket.subject}
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span class="${priorityClass}" style="font-size: 12px;">${ticket.priority.toUpperCase()}</span>
                            <span class="${statusClass}" style="font-size: 12px;">${ticket.status.toUpperCase().replace('-', ' ')}</span>
                        </div>
                    </div>
                `;
                recentContainer.appendChild(ticketDiv);
            });
        }
        
        // Profile dropdown functionality
        const profileBtn = document.getElementById('userProfileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileBtn && profileDropdown) {
            // Update profile dropdown stats
            document.getElementById('profileName').textContent = capitalizedName;
            document.getElementById('profileEmail').textContent = userData?.email || user.email;
            document.getElementById('statTotal').textContent = totalCount;
            document.getElementById('statOpen').textContent = openCount;
            document.getElementById('statResolved').textContent = resolvedCount;
            
            // Calculate average rating
            const ratedTickets = tickets.filter(t => t.rating);
            if (ratedTickets.length > 0) {
                const avgRating = (ratedTickets.reduce((sum, t) => sum + t.rating, 0) / ratedTickets.length).toFixed(1);
                document.getElementById('statRating').textContent = avgRating + ' ⭐';
            }
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('profileDropdown');
        const btn = document.getElementById('userProfileBtn');
        if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});
