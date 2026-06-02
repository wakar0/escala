// ============================================
// EMPLOYEE TICKET DETAIL WITH SUPABASE
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
    
    const ticketId = parseInt(localStorage.getItem('selectedTicket'));
    
    console.log('Loading ticket ID:', ticketId);
    
    if (!ticketId || isNaN(ticketId)) {
        alert('Invalid ticket ID');
        window.location.href = 'employee-tickets.html';
        return;
    }
    
    try {
        // Fetch ticket from Supabase
        const { data: ticket, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .single();
        
        console.log('Ticket data:', ticket);
        console.log('Ticket error:', error);
        
        if (error) throw error;
        
        if (!ticket) {
            alert('Ticket not found');
            window.location.href = 'employee-tickets.html';
            return;
        }
        
        // Display ticket information
        const detailRows = document.querySelectorAll('.ticket-detail .detail-row');
        const ticketIdFormatted = '#' + ticket.id.toString().padStart(3, '0');
        
        // Update header with ticket ID
        document.getElementById('ticketIdHeader').textContent = ticketIdFormatted;
        
        detailRows[0].querySelector('span').textContent = ticketIdFormatted;
        detailRows[1].querySelector('span').textContent = ticket.subject;
        detailRows[2].querySelector('span').textContent = ticket.description;
        
        const prioritySpan = detailRows[3].querySelector('span');
        prioritySpan.textContent = ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1);
        prioritySpan.className = 'priority-' + ticket.priority;
        
        const statusSpan = detailRows[4].querySelector('span');
        statusSpan.textContent = ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ');
        statusSpan.className = 'status-' + ticket.status.replace('-', '');
        
        const date = new Date(ticket.created_date);
        detailRows[5].querySelector('span').textContent = date.toLocaleString();
        
        // Calculate SLA status
        const now = new Date();
        const deadline = new Date(ticket.sla_deadline);
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        
        let slaStatus = 'Within SLA (' + Math.round(hoursLeft) + ' hours remaining)';
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
            slaStatus = 'Breached (' + Math.abs(Math.round(hoursLeft)) + ' hours overdue)';
            slaClass = 'sla-breach';
        } else if (hoursLeft < 2) {
            slaStatus = Math.round(hoursLeft * 60) + ' minutes remaining';
            slaClass = 'sla-warning';
        }
        
        const slaSpan = detailRows[6].querySelector('span');
        slaSpan.textContent = slaStatus;
        slaSpan.className = slaClass;
        
        // Show escalation status if escalated
        if (ticket.escalated) {
            const escalationDiv = document.createElement('div');
            escalationDiv.className = 'detail-row';
            escalationDiv.style.background = 'rgba(255, 107, 107, 0.1)';
            escalationDiv.style.padding = '15px';
            escalationDiv.style.borderRadius = '10px';
            escalationDiv.style.marginTop = '10px';
            escalationDiv.innerHTML = `
                <label style="color: #ff6b6b; font-weight: bold;">⚠️ Escalation Status:</label>
                <span style="color: #ff6b6b; font-weight: bold;">This ticket has been escalated</span>
            `;
            document.querySelector('.ticket-detail').appendChild(escalationDiv);
        }
        
        // Fetch and display comments
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('*, users(name, email)')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        
        const commentsBox = document.querySelector('.content-box');
        const commentsContainer = commentsBox.querySelector('.detail-row') || commentsBox;
        
        if (comments && comments.length > 0) {
            commentsContainer.innerHTML = '';
            comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.style.marginBottom = '15px';
                commentDiv.style.padding = '15px';
                commentDiv.style.background = 'rgba(102, 126, 234, 0.1)';
                commentDiv.style.borderRadius = '10px';
                commentDiv.style.borderLeft = '4px solid #667eea';
                
                const commentDate = new Date(comment.created_at);
                const timeAgo = getTimeAgo(commentDate);
                
                const userName = comment.users?.name || comment.users?.email || 'Admin';
                
                commentDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong style="color: #667eea;">${userName}</strong>
                        <span style="color: #888; font-size: 12px;">${timeAgo}</span>
                    </div>
                    <div style="color: #d0d0d0;">${comment.comment_text}</div>
                `;
                
                commentsContainer.appendChild(commentDiv);
            });
        } else {
            commentsContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No comments yet</div>';
        }
        
        // Show rating section if ticket is resolved
        if ((ticket.status === 'resolved' || ticket.status === 'closed') && !ticket.rating) {
            const ratingSection = document.getElementById('ratingSection');
            if (ratingSection) {
                ratingSection.style.display = 'block';
            
                // Add star rating functionality
                document.querySelectorAll('.star').forEach(star => {
                star.addEventListener('click', async function() {
                    const rating = parseInt(this.dataset.rating);
                    
                    try {
                        // Update ticket with rating in Supabase
                        const { error } = await supabase
                            .from('tickets')
                            .update({ rating: rating })
                            .eq('id', ticketId);
                        
                        if (error) throw error;
                        
                        // Visual feedback
                        document.querySelectorAll('.star').forEach((s, i) => {
                            if (i < rating) {
                                s.classList.add('active');
                            } else {
                                s.classList.remove('active');
                            }
                        });
                        
                        setTimeout(() => {
                            alert('Thank you for your feedback!');
                            document.getElementById('ratingSection').style.display = 'none';
                        }, 500);
                        
                    } catch (error) {
                        console.error('Error saving rating:', error);
                        alert('Failed to save rating. Please try again.');
                    }
                });
                
                star.addEventListener('mouseenter', function() {
                    const rating = parseInt(this.dataset.rating);
                    document.querySelectorAll('.star').forEach((s, i) => {
                        if (i < rating) {
                            s.style.color = '#ffd700';
                        } else {
                            s.style.color = '#444';
                        }
                    });
                });
            });
            
            const starRating = document.querySelector('.star-rating');
            if (starRating) {
                starRating.addEventListener('mouseleave', function() {
                    document.querySelectorAll('.star').forEach(s => {
                        if (!s.classList.contains('active')) {
                            s.style.color = '#444';
                        }
                    });
                });
            }
            }
        }
        
    } catch (error) {
        console.error('Error loading ticket:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert('Error loading ticket details: ' + (error?.message || 'Unknown error'));
        window.location.href = 'employee-tickets.html';
    }
});

function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return seconds + 's ago';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}
