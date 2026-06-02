// ============================================
// CREATE TICKET WITH SUPABASE
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
    if (document.getElementById('userGreeting')) {
        document.getElementById('userGreeting').textContent = 'Hello, ' + capitalizedName;
    }
    
    // Add form submit handler
    document.getElementById('createTicketForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        document.getElementById('subjectError').textContent = '';
        document.getElementById('descriptionError').textContent = '';
        document.getElementById('priorityError').textContent = '';
        document.getElementById('categoryError').textContent = '';
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
        
        // Get values
        const subject = document.getElementById('subject').value.trim();
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const priority = document.getElementById('priority').value;
        
        let isValid = true;
        
        // Validate subject
        if (!subject) {
            document.getElementById('subjectError').textContent = 'Subject is required';
            isValid = false;
        } else if (subject.length < 5) {
            document.getElementById('subjectError').textContent = 'Subject must be at least 5 characters';
            isValid = false;
        }
        
        // Validate description
        if (!description) {
            document.getElementById('descriptionError').textContent = 'Description is required';
            isValid = false;
        } else if (description.length < 10) {
            document.getElementById('descriptionError').textContent = 'Description must be at least 10 characters';
            isValid = false;
        }
        
        // Validate priority
        if (!priority) {
            document.getElementById('priorityError').textContent = 'Please select a priority level';
            isValid = false;
        }
        
        // Validate category
        if (!category) {
            document.getElementById('categoryError').textContent = 'Please select a category';
            isValid = false;
        }
        
        // If validation fails
        if (!isValid) {
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.textContent = 'Please fix the errors above';
            errorMsg.style.display = 'block';
            return;
        }
        
        // Calculate SLA deadline based on priority
        const now = new Date();
        let slaHours = 48; // default for low
        if (priority === 'critical') slaHours = 2;
        else if (priority === 'high') slaHours = 8;
        else if (priority === 'medium') slaHours = 24;
        
        const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
        
        try {
            // Insert ticket into Supabase
            const { data, error } = await supabase
                .from('tickets')
                .insert([{
                    subject: subject,
                    description: description,
                    category: category,
                    priority: priority,
                    status: 'open',
                    created_by: user.id,
                    assigned_to: 'Unassigned',
                    sla_deadline: slaDeadline.toISOString(),
                    escalated: false
                }])
                .select();
            
            if (error) throw error;
            
            // Show success message
            const successMsg = document.getElementById('successMessage');
            successMsg.textContent = 'Ticket #' + data[0].id.toString().padStart(3, '0') + ' created successfully! Redirecting...';
            successMsg.style.display = 'block';
            
            // Disable form
            document.getElementById('subject').disabled = true;
            document.getElementById('description').disabled = true;
            document.getElementById('priority').disabled = true;
            document.getElementById('category').disabled = true;
            
            // Disable and update button
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            submitBtn.style.opacity = '0.6';
            
            // Disable cancel button
            document.getElementById('cancelBtn').style.pointerEvents = 'none';
            document.getElementById('cancelBtn').style.opacity = '0.6';
            
            // Redirect after 1.5 seconds
            setTimeout(function() {
                window.location.href = 'employee-tickets.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error creating ticket:', error);
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.textContent = error.message || 'Failed to create ticket. Please try again.';
            errorMsg.style.display = 'block';
        }
    });
    
    // Real-time validation on blur
    document.getElementById('subject').addEventListener('blur', function() {
        const subject = this.value.trim();
        if (subject && subject.length < 5) {
            document.getElementById('subjectError').textContent = 'Subject must be at least 5 characters';
        } else {
            document.getElementById('subjectError').textContent = '';
        }
    });

    document.getElementById('description').addEventListener('blur', function() {
        const description = this.value.trim();
        if (description && description.length < 10) {
            document.getElementById('descriptionError').textContent = 'Description must be at least 10 characters';
        } else {
            document.getElementById('descriptionError').textContent = '';
        }
    });

    document.getElementById('priority').addEventListener('blur', function() {
        const priority = this.value;
        if (!priority) {
            document.getElementById('priorityError').textContent = 'Please select a priority level';
        } else {
            document.getElementById('priorityError').textContent = '';
        }
    });
});
