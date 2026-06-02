// ============================================
// EMPLOYEE TICKETS WITH SUPABASE
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set personalized greeting
    const userName = user.email.split('@')[0];
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
    document.getElementById('userGreeting').textContent = 'Hello, ' + capitalizedName;
    
    await loadTickets();
    
    // Add search functionality
    document.getElementById('searchTickets').addEventListener('input', loadTickets);
    
    // Add filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadTickets();
        });
    });
});

async function loadTickets() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const tbody = document.querySelector('tbody');
    const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    
    try {
        // Fetch tickets from Supabase
        let query = supabase
            .from('tickets')
            .select('*')
            .eq('created_by', user.id)
            .order('created_date', { ascending: false });
        
        const { data: tickets, error } = await query;
        
        if (error) throw error;
        
        // Apply filters
        let filteredTickets = tickets;
        
        // Search filter
        if (searchTerm) {
            filteredTickets = filteredTickets.filter(t =>
                t.subject.toLowerCase().includes(searchTerm) ||
                t.id.toString().includes(searchTerm)
            );
        }
        
        // Status filter
        if (activeFilter !== 'all') {
            filteredTickets = filteredTickets.filter(t => {
                const status = t.status.replace('-', '');
                return status === activeFilter || t.status === activeFilter;
            });
        }
        
        if (filteredTickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 40px;">No tickets found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        filteredTickets.forEach(ticket => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.onclick = function() {
                localStorage.setItem('selectedTicket', ticket.id);
                window.location.href = 'employee-ticket-detail.html';
            };
            
            // Format date
            const date = new Date(ticket.created_date);
            const formattedDate = date.toLocaleDateString();
            
            // Calculate SLA status
            const now = new Date();
            const deadline = new Date(ticket.sla_deadline);
            const hoursLeft = (deadline - now) / (1000 * 60 * 60);
            
            let slaStatus = 'Within SLA';
            let slaClass = 'sla-ok';
            
            if (ticket.status === 'resolved' || ticket.status === 'closed') {
                if (ticket.resolved_date) {
                    const resolvedTime = new Date(ticket.resolved_date);
                    slaStatus = 'Resolved ' + getTimeAgo(resolvedTime);
                } else {
                    slaStatus = 'Resolved';
                }
                slaClass = 'sla-ok';
            } else if (hoursLeft < 0) {
                slaStatus = 'Breached';
                slaClass = 'sla-breach';
            } else if (hoursLeft < 2) {
                slaStatus = Math.round(hoursLeft * 60) + ' min left';
                slaClass = 'sla-warning';
            } else {
                slaStatus = Math.round(hoursLeft) + ' hours left';
                slaClass = 'sla-ok';
            }
            
            row.innerHTML = `
                <td>#${ticket.id.toString().padStart(3, '0')}</td>
                <td>${ticket.subject}</td>
                <td class="priority-${ticket.priority}">${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</td>
                <td class="status-${ticket.status.replace('-', '')}">${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}</td>
                <td>${formattedDate}</td>
                <td class="${slaClass}">${slaStatus}</td>
            `;
            
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #dc3545; padding: 40px;">Error loading tickets</td></tr>';
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return seconds + 's ago';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}
