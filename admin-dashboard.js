// ============================================
// ADMIN DASHBOARD WITH SUPABASE
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
    
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
        alert('Access denied. Admin only.');
        window.location.href = 'index.html';
        return;
    }
    
    // Set admin greeting
    document.getElementById('adminGreeting').textContent = 'Administrator';
    
    try {
        // Fetch all tickets from Supabase
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*')
            .order('created_date', { ascending: false });
        
        if (error) throw error;
        
        // Calculate counts (only open/in-progress tickets)
        const totalCount = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
        const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
        
        // Calculate SLA breaches
        const now = new Date();
        const breachCount = tickets.filter(t => {
            if (t.status === 'resolved' || t.status === 'closed') return false;
            const deadline = new Date(t.sla_deadline);
            return now > deadline;
        }).length;
        
        const escalatedCount = tickets.filter(t => t.escalated).length;
        
        // Update dashboard cards
        document.querySelectorAll('.card')[0].querySelector('.number').textContent = totalCount;
        document.querySelectorAll('.card')[1].querySelector('.number').textContent = openCount;
        document.querySelectorAll('.card')[2].querySelector('.number').textContent = breachCount;
        document.querySelectorAll('.card')[3].querySelector('.number').textContent = escalatedCount;
        
        // Load recent activity
        const recentTickets = tickets.slice(0, 3);
        const tbody = document.querySelector('tbody');
        
        if (recentTickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #888; padding: 40px;">No recent activity</td></tr>';
        } else {
            tbody.innerHTML = '';
            
            recentTickets.forEach(ticket => {
                const row = document.createElement('tr');
                
                let timeDisplay;
                if (ticket.status === 'resolved' || ticket.status === 'closed') {
                    const resolvedDate = new Date(ticket.resolved_date || ticket.created_date);
                    timeDisplay = 'Resolved ' + getTimeAgo(resolvedDate);
                } else {
                    const createdDate = new Date(ticket.created_date);
                    timeDisplay = getTimeAgo(createdDate);
                }
                
                row.innerHTML = `
                    <td>Ticket #${ticket.id.toString().padStart(3, '0')} - ${ticket.subject}</td>
                    <td>${timeDisplay}</td>
                `;
                
                tbody.appendChild(row);
            });
        }
        
        // Profile dropdown functionality
        const profileBtn = document.getElementById('userProfileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileBtn && profileDropdown) {
            // Update profile dropdown stats
            document.getElementById('adminStatActive').textContent = totalCount;
            document.getElementById('adminStatBreaches').textContent = breachCount;
            document.getElementById('adminStatEscalated').textContent = escalatedCount;
            
            // Calculate compliance rate (resolved tickets within SLA)
            const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
            const resolvedWithinSLA = resolvedTickets.filter(t => {
                if (!t.resolved_date) return true;
                const deadline = new Date(t.sla_deadline);
                const resolved = new Date(t.resolved_date);
                return resolved <= deadline;
            }).length;
            const complianceRate = resolvedTickets.length > 0 
                ? ((resolvedWithinSLA / resolvedTickets.length) * 100).toFixed(0)
                : 100;
            document.getElementById('adminStatCompliance').textContent = complianceRate + '%';
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

function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return seconds + ' seconds ago';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}
