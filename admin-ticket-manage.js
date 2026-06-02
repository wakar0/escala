// Load and manage ticket details
document.addEventListener('DOMContentLoaded', async function() {
    const ticketId = parseInt(localStorage.getItem('selectedTicket'));
    
    const { data: ticket } = await supabase
        .from('tickets')
        .select('*, users(name, email)')
        .eq('id', ticketId)
        .single();
    
    if (!ticket) {
        alert('Ticket not found');
        window.location.href = 'admin-tickets.html';
        return;
    }
    
    const detailRows = document.querySelectorAll('.ticket-detail .detail-row');
    detailRows[0].querySelector('span').textContent = '#' + ticket.id.toString().padStart(3, '0');
    detailRows[1].querySelector('span').textContent = ticket.users?.name || ticket.users?.email || 'Unknown';
    detailRows[2].querySelector('span').textContent = ticket.subject;
    detailRows[3].querySelector('span').textContent = ticket.description;
    detailRows[4].querySelector('span').textContent = new Date(ticket.created_date).toLocaleString();
    
    const now = new Date();
    const deadline = new Date(ticket.sla_deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    
    let slaStatus, slaClass;
    if (['resolved', 'closed'].includes(ticket.status)) {
        slaStatus = 'Resolved';
        slaClass = 'sla-ok';
    } else if (hoursLeft < 0) {
        slaStatus = 'Breached (' + Math.abs(Math.round(hoursLeft)) + ' hours overdue)';
        slaClass = 'sla-breach';
    } else {
        slaStatus = 'Within SLA (' + Math.round(hoursLeft) + ' hours remaining)';
        slaClass = 'sla-ok';
    }
    
    const slaSpan = detailRows[5].querySelector('span');
    slaSpan.textContent = slaStatus;
    slaSpan.className = slaClass;
    
    const statusSelect = document.querySelector('select[name="status"]') || document.querySelectorAll('.form-group select')[0];
    const assignSelect = document.querySelector('select[name="assign"]') || document.querySelectorAll('.form-group select')[1];
    const prioritySelect = document.querySelector('select[name="priority"]') || document.querySelectorAll('.form-group select')[2];
    
    statusSelect.value = ticket.status;
    prioritySelect.value = ticket.priority;
    if (ticket.assigned_to) assignSelect.value = ticket.assigned_to;
    
    document.querySelector('form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const oldStatus = ticket.status;
        const newStatus = statusSelect.value;
        
        const updateData = {
            status: newStatus,
            assigned_to: assignSelect.value,
            priority: prioritySelect.value
        };
        
        if (!['resolved', 'closed'].includes(oldStatus) && ['resolved', 'closed'].includes(newStatus)) {
            updateData.resolved_date = new Date().toISOString();
            
            await supabase.from('comments').insert({
                ticket_id: ticketId,
                user_id: (await getCurrentUser()).id,
                comment_text: 'Ticket marked as ' + newStatus
            });
        }
        
        const comment = document.querySelector('textarea').value.trim();
        if (comment) {
            await supabase.from('comments').insert({
                ticket_id: ticketId,
                user_id: (await getCurrentUser()).id,
                comment_text: comment
            });
        }
        
        await supabase.from('tickets').update(updateData).eq('id', ticketId);
        
        alert('Ticket updated successfully!');
        window.location.reload();
    });
    
    const escalateBtn = document.querySelectorAll('.actions button')[1];
    escalateBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (confirm('Are you sure you want to escalate this ticket?')) {
            await supabase.from('tickets').update({ escalated: true }).eq('id', ticketId);
            
            await supabase.from('comments').insert({
                ticket_id: ticketId,
                user_id: (await getCurrentUser()).id,
                comment_text: 'Ticket escalated by admin'
            });
            
            alert('Ticket escalated successfully!');
            window.location.reload();
        }
    });
});
