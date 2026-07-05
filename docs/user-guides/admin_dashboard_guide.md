# GramSathi — Admin Dashboard Guide

## Dashboard Overview

The GramSathi Admin Dashboard is a web application for government officers, scheme administrators, and system admins to manage citizen data, process applications, and monitor system health.

**URL**: `https://admin.gramsathi.ai`  
**Role Required**: officer, admin, or super_admin

## Officer Dashboard

### Login
1. Navigate to `https://admin.gramsathi.ai`
2. Enter your official email (e.g., `name@gov.in`)
3. Enter OTP sent to your registered mobile
4. Set a 4-digit PIN for quick access

### Home Screen KPIs
- **Pending Applications**: Count requiring your review
- **Today's Approvals**: Count approved today
- **Pending Grievances**: Count requiring attention
- **SLA Breach**: Applications overdue by > 7 days

### Processing Applications
1. **View Pending Applications**
   - Click **"Applications" → "Pending"**
   - Filter by scheme, date range, district
   - Sort by priority, application date

2. **Review Application**
   - Click an application row
   - View citizen details, documents, AI-generated summary
   - Verify document authenticity (OCR status visible)
   - Check eligibility criteria (system-checked + manual verification)

3. **Decide**
   - **Approve**: Enter Government Reference ID, approve
   - **Reject**: Select reason from dropdown (with detailed notes)
   - **Request More Info**: Send auto-generated notification to citizen

4. **Bulk Operations**
   - Select multiple applications
   - Click **"Bulk Approve"** or **"Bulk Reject"**
   - Review list of selected items before confirming

### Managing Grievances
1. **View Grievances**: Click **"Grievances"** from sidebar
2. **Filters**: By status (pending/in progress/resolved), category, priority, district
3. **Process**: 
   - View grievance details + AI translation (if filed in Hindi/regional language)
   - Add internal notes (citizen cannot see)
   - **Escalate**: Route to higher authority with reason
   - **Resolve**: Add resolution notes, mark as complete
4. **SLA Monitoring**: Red indicator if > 5 business days

### Citizen Search
1. Click **"Citizens"** in sidebar
2. Search by: Name, Phone, Aadhaar (last 4 digits), Application ID
3. View citizen profile, application history, documents, grievances
4. Make profile changes if authorized

## Admin Dashboard

### Scheme Management
1. **List Schemes**: View all schemes with active/inactive toggle
2. **Create/Edit Scheme**: 
   - Name (English + Hindi + regional)
   - Category, Ministry, Department
   - Benefits description
   - Eligibility criteria (JSON-based rules)
   - Required documents (multi-select)
   - Tags (for search/matching)
3. **Activate/Deactivate**: Control scheme visibility to citizens

### Document Templates
1. **Manage Templates**: Add/remove document types
2. **Configure OCR Fields**: Define which fields to extract for each document type

### Notification Templates
1. **Templates**: Create and manage notification message templates
2. **Variables**: Use variables like `{{citizen_name}}`, `{{scheme_name}}`, `{{status}}`
3. **Channels**: Configure per-channel content (push/SMS/WhatsApp)

### User Management
1. **Officers**: Add/remove officers, assign districts, set permissions
2. **Roles**: officer (district-level), admin (state-level), super_admin (system-wide)

## Super Admin Dashboard

### System Health
- **Services**: Real-time status of all 9 microservices
- **Infrastructure**: CPU, memory, disk usage per service
- **Database**: Connection count, slow queries, replication lag

### Audit Logs
- **User Activity**: All officer/admin actions with timestamps
- **Data Changes**: Track modifications to citizen profiles, applications
- **Export**: Download audit logs for compliance

### Configuration
- **Rate Limits**: Per-endpoint configurations
- **Feature Flags**: Toggle features on/off per region
- **Maintenance Mode**: Put system in read-only mode

### Data Export
- **Analytics Reports**: Download scheme-wise, district-wise reports
- **Format**: CSV, Excel, PDF
- **Scheduled Reports**: Set up daily/weekly email reports

## Analytics Dashboard

### Overview KPIs
| Metric | Description |
|--------|-------------|
| Total Citizens | Registered users |
| Active Today | Users who logged in today |
| Total Applications | All time applications |
| Approval Rate | Percentage approved |
| Avg Processing Time | Average days from submit to decision |
| Top Schemes | Most applied schemes |
| Grievance Resolution Rate | Percentage resolved within SLA |

### Geographic View
- State/district-level heat map of applications
- Filter by scheme, date range
- Click district to drill down

### AI & System Metrics
| Metric | Target |
|--------|--------|
| AI Chat Accuracy | > 90% |
| OCR Success Rate | > 95% |
| Voice Recognition Accuracy | > 85% |
| API Latency (p95) | < 1s |
| Service Uptime | > 99.9% |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` | Open Applications |
| `G` | Open Grievances |
| `C` | Open Citizens Search |
| `/` | Focus search bar |
| `N` | New (context dependent) |
| `Esc` | Close modal |
| `?` | Show shortcuts help |

## Best Practices

1. **Process applications within 48 hours** to maintain SLA
2. **Use AI-generated summaries** for faster review, but always verify
3. **Document all rejections** with clear reasons (helps citizen improve)
4. **Escalate grievances promptly** if beyond your jurisdiction
5. **Run weekly reports** to identify processing bottlenecks
6. **Log out** when leaving the terminal (sessions auto-expire after 30 min inactivity)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot log in | Check email is correct, request new OTP, contact IT |
| Dashboard slow | Refresh page, check internet, clear browser cache |
| Application not found | Verify correct filter set, check all applications tab |
| Can't approve | Check you have required permissions, contact super_admin |
| Export fails | Reduce date range, try smaller section export |
