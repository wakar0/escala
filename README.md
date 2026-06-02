# 🎫 ESCALA - IT Support & SLA Management System

A comprehensive IT support ticket management system with SLA tracking, escalation management, and real-time analytics. Built with HTML, CSS, JavaScript, and Supabase backend.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

---

## ✨ Features

### 👤 Employee Features
- Create and track support tickets
- View ticket status and history
- Rate resolved tickets (5-star system)
- Real-time SLA tracking
- Comment history visibility

### 👨‍💼 Admin Features
- Manage all tickets
- Bulk status updates
- Ticket assignment and escalation
- SLA breach monitoring
- Comprehensive reports with CSV export
- Real-time dashboard analytics

---

## 🚀 Quick Start

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/escala.git
cd escala
```

2. **Setup Supabase**
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Copy your project URL and anon key

3. **Configure the app**
```bash
# Copy the example config file
cp supabase-config.example.js supabase-config.js

# Edit supabase-config.js and add your credentials:
# SUPABASE_URL = 'your-project-url'
# SUPABASE_ANON_KEY = 'your-anon-key'
```

4. **Setup Database**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run the SQL from `supabase-schema.sql`

5. **Run the application**
   - Open `index.html` in your browser
   - Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

6. **Create Admin Account**
   - Sign up with your admin email
   - In Supabase SQL Editor, run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

---

## 📊 SLA Times

| Priority | Response Time |
|----------|--------------|
| Critical | 2 hours      |
| High     | 8 hours      |
| Medium   | 24 hours     |
| Low      | 48 hours     |

---

## 🎨 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT)
- **Storage:** Supabase Database
- **Design:** Glassmorphism UI

---

## 📁 Project Structure

```
escala/
├── index.html                      # Login page
├── employee-dashboard.html         # Employee dashboard
├── employee-tickets.html           # Employee ticket list
├── employee-create-ticket.html     # Create ticket form
├── employee-ticket-detail.html     # Ticket details
├── admin-dashboard.html            # Admin dashboard
├── admin-tickets.html              # All tickets management
├── admin-ticket-manage.html        # Individual ticket management
├── admin-sla-breaches.html         # SLA breach monitoring
├── admin-reports.html              # Reports and analytics
├── style.css                       # Complete styling
├── supabase-config.example.js      # Config template
├── login.js                        # Authentication logic
├── create-ticket.js                # Ticket creation
├── employee-dashboard.js           # Employee dashboard logic
├── employee-tickets.js             # Ticket list logic
├── employee-ticket-detail.js       # Ticket detail logic
├── admin-dashboard.js              # Admin dashboard logic
├── admin-tickets.js                # Ticket management logic
├── admin-ticket-manage.js          # Individual ticket logic
├── admin-sla-breaches.js           # SLA breach logic
├── admin-reports.js                # Reports logic
├── supabase-schema.sql             # Database schema
└── README.md                       # This file
```

---

## 🔒 Security

- Row Level Security (RLS) enabled
- JWT-based authentication
- Role-based access control
- Secure password hashing
- SQL injection protection

---

## 📸 Screenshots

### Login Page
Modern split-screen design with animated background

### Employee Dashboard
Personalized dashboard with ticket statistics

### Admin Dashboard
Comprehensive analytics and SLA monitoring

---

## 🛠️ Configuration

### Environment Variables
Create `supabase-config.js` with:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Database Setup
Run the SQL schema in Supabase SQL Editor:
- Creates 4 tables: users, tickets, comments, notifications
- Sets up Row Level Security policies
- Creates indexes for performance
- Adds triggers for auto user creation

---

## 📝 Usage

### For Employees:
1. Login with any email/password
2. Select "Employee" role
3. Create tickets with priority and category
4. Track ticket status and SLA
5. Rate resolved tickets

### For Admins:
1. Login with admin email
2. Select "Admin" role
3. View all tickets and analytics
4. Assign and manage tickets
5. Monitor SLA breaches
6. Generate reports

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

Built as an academic demonstration of IT support system

---

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Modern UI/UX design principles
- Glassmorphism design trend

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation files

---

## 🔮 Future Enhancements

- [ ] Email notifications
- [ ] File attachments
- [ ] Advanced analytics charts
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Dark/Light mode toggle
- [ ] Knowledge base integration

---

**⭐ Star this repo if you find it helpful!**
