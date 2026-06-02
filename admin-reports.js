// Load and display admin reports
document.addEventListener('DOMContentLoaded', async function() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const admin = await isAdmin();
    if (!admin) {
        alert('Access denied. Admin only.');
        window.location.href = 'index.html';
        return;
    }
    
    const { data: tickets, error } = await supabase.from('tickets').select('*');
    
    console.log('Tickets loaded:', tickets);
    console.log('Error:', error);
    
    const openCount = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressCount = tickets?.filter(t => t.status === 'in-progress').length || 0;
    const resolvedCount = tickets?.filter(t => t.status === 'resolved').length || 0;
    const closedCount = tickets?.filter(t => t.status === 'closed').length || 0;
    
    console.log('Status counts:', { openCount, inProgressCount, resolvedCount, closedCount });
    
    const lowCount = tickets?.filter(t => t.priority === 'low').length || 0;
    const mediumCount = tickets?.filter(t => t.priority === 'medium').length || 0;
    const highCount = tickets?.filter(t => t.priority === 'high').length || 0;
    const criticalCount = tickets?.filter(t => t.priority === 'critical').length || 0;
    
    const now = new Date();
    let breachCount = 0;
    let totalResolutionTime = 0;
    let resolvedTicketsCount = 0;
    
    tickets?.forEach(ticket => {
        const deadline = new Date(ticket.sla_deadline);
        
        if (!['resolved', 'closed'].includes(ticket.status)) {
            if (now > deadline) breachCount++;
        }
        
        if (['resolved', 'closed'].includes(ticket.status) && ticket.resolved_date) {
            const created = new Date(ticket.created_date);
            const resolved = new Date(ticket.resolved_date);
            totalResolutionTime += (resolved - created) / (1000 * 60 * 60);
            resolvedTicketsCount++;
        }
    });
    
    const avgResolutionTime = resolvedTicketsCount > 0 
        ? (totalResolutionTime / resolvedTicketsCount).toFixed(1) 
        : 0;
    
    const totalActiveTickets = tickets?.filter(t => !['resolved', 'closed'].includes(t.status)).length || 0;
    const complianceRate = totalActiveTickets > 0 
        ? (((totalActiveTickets - breachCount) / totalActiveTickets) * 100).toFixed(1)
        : 100;
    
    const statusTable = document.querySelectorAll('table')[0];
    statusTable.rows[0].cells[1].textContent = openCount;
    statusTable.rows[1].cells[1].textContent = inProgressCount;
    statusTable.rows[2].cells[1].textContent = resolvedCount;
    statusTable.rows[3].cells[1].textContent = closedCount;
    
    const priorityCountTable = document.querySelectorAll('table')[1];
    priorityCountTable.rows[0].cells[1].textContent = lowCount;
    priorityCountTable.rows[1].cells[1].textContent = mediumCount;
    priorityCountTable.rows[2].cells[1].textContent = highCount;
    priorityCountTable.rows[3].cells[1].textContent = criticalCount;
    
    const slaTable = document.querySelectorAll('table')[2];
    slaTable.rows[0].cells[1].textContent = complianceRate + '%';
    slaTable.rows[1].cells[1].textContent = avgResolutionTime + ' hours';
    slaTable.rows[2].cells[1].textContent = breachCount;
    
    if (complianceRate >= 90) {
        slaTable.rows[0].cells[1].style.color = '#28a745';
    } else if (complianceRate >= 70) {
        slaTable.rows[0].cells[1].style.color = '#ffc107';
    } else {
        slaTable.rows[0].cells[1].style.color = '#dc3545';
    }
    
    const priorities = ['low', 'medium', 'high', 'critical'];
    const priorityResolutionTable = document.getElementById('resolutionByPriority');
    
    priorities.forEach((priority, index) => {
        const priorityTickets = tickets?.filter(t => 
            t.priority === priority && 
            ['resolved', 'closed'].includes(t.status) && 
            t.resolved_date
        ) || [];
        
        if (priorityTickets.length > 0) {
            let totalTime = 0;
            priorityTickets.forEach(ticket => {
                const created = new Date(ticket.created_date);
                const resolved = new Date(ticket.resolved_date);
                totalTime += (resolved - created) / (1000 * 60 * 60);
            });
            priorityResolutionTable.rows[index].cells[1].textContent = (totalTime / priorityTickets.length).toFixed(1) + ' hours';
        } else {
            priorityResolutionTable.rows[index].cells[1].textContent = 'No data';
        }
    });
    
    const categories = ['hardware', 'software', 'network', 'access', 'other'];
    const categoryTable = document.getElementById('resolutionByCategory');
    
    categories.forEach((category, index) => {
        const categoryTickets = tickets?.filter(t => 
            t.category === category && 
            ['resolved', 'closed'].includes(t.status) && 
            t.resolved_date
        ) || [];
        
        if (categoryTickets.length > 0) {
            let totalTime = 0;
            categoryTickets.forEach(ticket => {
                const created = new Date(ticket.created_date);
                const resolved = new Date(ticket.resolved_date);
                totalTime += (resolved - created) / (1000 * 60 * 60);
            });
            categoryTable.rows[index].cells[1].textContent = (totalTime / categoryTickets.length).toFixed(1) + ' hours';
        } else {
            categoryTable.rows[index].cells[1].textContent = 'No data';
        }
    });
});

async function exportReport() {
    const { data: tickets } = await supabase.from('tickets').select('*');
    
    let csvContent = 'Ticket ID,Subject,Category,Priority,Status,Created By,Created Date,Assigned To,SLA Status,Rating\n';
    
    const now = new Date();
    tickets?.forEach(ticket => {
        const date = new Date(ticket.created_date).toLocaleString();
        const deadline = new Date(ticket.sla_deadline);
        let slaStatus = 'Within SLA';
        
        if (['resolved', 'closed'].includes(ticket.status)) {
            slaStatus = 'Resolved';
        } else if (now > deadline) {
            slaStatus = 'Breached';
        }
        
        csvContent += `#${ticket.id.toString().padStart(3, '0')},"${ticket.subject}",${ticket.category || 'N/A'},${ticket.priority},${ticket.status},User,${date},${ticket.assigned_to || 'Unassigned'},${slaStatus},${ticket.rating || 'N/A'}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'escala-report-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
