// Load and display SLA breached tickets
document.addEventListener('DOMContentLoaded', async function() {
    const tbody = document.querySelector('tbody');
    
    if (document.getElementById('adminGreeting')) {
        document.getElementById('adminGreeting').textContent = 'Administrator';
    }
    
    const { data: tickets } = await supabase
        .from('tickets')
        .select('*, users(name, email)')
        .neq('status', 'resolved')
        .neq('status', 'closed')
        .order('created_date', { ascending: false });
    
    const now = new Date();
    const breachedTickets = tickets?.filter(t => new Date(t.sla_deadline) < now) || [];
    
    if (breachedTickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 40px;">No SLA breaches found</td></tr>';
        return;
    }
    
    tbody.innerHTML = breachedTickets.map(ticket => {
        const deadline = new Date(ticket.sla_deadline);
        const hoursOverdue = Math.abs((now - deadline) / (1000 * 60 * 60));
        const timeOverdue = hoursOverdue < 24 
            ? Math.round(hoursOverdue) + ' hours overdue'
            : Math.round(hoursOverdue / 24) + ' days overdue';
        
        const escalationStatus = ticket.escalated ? 'Escalated' : 'Not Escalated';
        
        return `
            <tr style="cursor: pointer; background: rgba(255, 107, 107, 0.1);" onclick="localStorage.setItem('selectedTicket', ${ticket.id}); window.location.href='admin-ticket-manage.html';">
                <td>#${ticket.id.toString().padStart(3, '0')}</td>
                <td>${ticket.users?.name || ticket.users?.email || 'Unknown'}</td>
                <td>${ticket.subject}</td>
                <td class="priority-${ticket.priority}">${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</td>
                <td class="sla-breach">${timeOverdue}</td>
                <td style="color: ${ticket.escalated ? '#ffd93d' : '#888'};">${escalationStatus}</td>
            </tr>
        `;
    }).join('');
});
