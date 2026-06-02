// Load and display all tickets for admin
document.addEventListener('DOMContentLoaded', async function() {
    await loadTickets();
    
    document.getElementById('statusFilter').addEventListener('change', loadTickets);
    document.getElementById('priorityFilter').addEventListener('change', loadTickets);
    document.getElementById('slaFilter').addEventListener('change', loadTickets);
    
    if (document.getElementById('searchTickets')) {
        document.getElementById('searchTickets').addEventListener('input', loadTickets);
    }
    
    document.getElementById('selectAll').addEventListener('change', function() {
        document.querySelectorAll('.ticket-checkbox').forEach(cb => cb.checked = this.checked);
        toggleBulkActions();
    });
    
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('ticket-checkbox')) {
            toggleBulkActions();
        }
    });
});

function toggleBulkActions() {
    const selectedCount = document.querySelectorAll('.ticket-checkbox:checked').length;
    document.getElementById('bulkActions').style.display = selectedCount > 0 ? 'flex' : 'none';
}

async function checkSLABreaches() {
    const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .neq('status', 'resolved')
        .neq('status', 'closed');
    
    const now = new Date();
    const breachCount = tickets?.filter(t => new Date(t.sla_deadline) < now).length || 0;
    
    const badge = document.getElementById('breachBadge');
    badge.textContent = breachCount;
    badge.style.display = breachCount > 0 ? 'inline' : 'none';
}

setInterval(checkSLABreaches, 30000);
checkSLABreaches();

async function loadTickets() {
    const tbody = document.querySelector('tbody');
    
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const slaFilter = document.getElementById('slaFilter').value;
    const searchTerm = document.getElementById('searchTickets')?.value.toLowerCase() || '';
    
    let query = supabase.from('tickets').select('*, users(name)');
    
    if (statusFilter !== 'All Status') {
        query = query.eq('status', statusFilter.toLowerCase().replace(' ', '-'));
    } else {
        query = query.neq('status', 'resolved').neq('status', 'closed');
    }
    
    if (priorityFilter !== 'All Priority') {
        query = query.eq('priority', priorityFilter.toLowerCase());
    }
    
    const { data: tickets } = await query.order('created_date', { ascending: false });
    
    let filteredTickets = tickets || [];
    
    if (searchTerm) {
        filteredTickets = filteredTickets.filter(t => 
            t.subject.toLowerCase().includes(searchTerm) ||
            t.id.toString().includes(searchTerm) ||
            t.users?.name.toLowerCase().includes(searchTerm)
        );
    }
    
    const now = new Date();
    if (slaFilter === 'Within SLA') {
        filteredTickets = filteredTickets.filter(t => 
            ['resolved', 'closed'].includes(t.status) || new Date(t.sla_deadline) >= now
        );
    } else if (slaFilter === 'Breached') {
        filteredTickets = filteredTickets.filter(t => 
            !['resolved', 'closed'].includes(t.status) && new Date(t.sla_deadline) < now
        );
    }
    
    if (filteredTickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #888; padding: 40px;">No tickets found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredTickets.map(ticket => {
        const date = new Date(ticket.created_date).toLocaleDateString();
        const deadline = new Date(ticket.sla_deadline);
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        
        let slaStatus, slaClass;
        if (['resolved', 'closed'].includes(ticket.status)) {
            slaStatus = 'Resolved';
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
        
        return `
            <tr data-ticket-id="${ticket.id}">
                <td><input type="checkbox" class="ticket-checkbox" value="${ticket.id}"></td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;">#${ticket.id.toString().padStart(3, '0')}</td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;">${ticket.users?.name || 'Unknown'}</td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;">${ticket.subject}</td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;" class="priority-${ticket.priority}">${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;" class="status-${ticket.status.replace('-', '')}">${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}</td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;">${ticket.assigned_to || 'Unassigned'}</td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;" class="${slaClass}">${slaStatus}</td>
                <td onclick="viewTicket(${ticket.id})" style="cursor: pointer;">${date}</td>
            </tr>
        `;
    }).join('');
}

function viewTicket(ticketId) {
    localStorage.setItem('selectedTicket', ticketId);
    window.location.href = 'admin-ticket-manage.html';
}

async function applyBulkAction() {
    const selectedCheckboxes = document.querySelectorAll('.ticket-checkbox:checked');
    const bulkStatus = document.getElementById('bulkStatus').value;
    
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one ticket');
        return;
    }
    
    if (!bulkStatus) {
        alert('Please select an action');
        return;
    }
    
    const ticketIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    const updateData = { status: bulkStatus };
    
    if (bulkStatus === 'resolved') {
        updateData.resolved_date = new Date().toISOString();
    }
    
    await supabase.from('tickets').update(updateData).in('id', ticketIds);
    
    alert(`${ticketIds.length} ticket(s) updated successfully`);
    loadTickets();
}
