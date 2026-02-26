# LDC Tools - Power Apps + SharePoint Solution

**A self-contained construction management application for Microsoft 365**

## Overview

This is a complete rewrite of LDC Tools as a Power Apps canvas application with SharePoint as the data backend. The solution runs entirely within your M365 tenant with no external dependencies, ensuring data governance and security compliance.

## Architecture

```
┌─────────────────────────────────────────┐
│      Power Apps Canvas App              │
│  - Dashboard with KPIs                   │
│  - Projects management                   │
│  - Tasks management                      │
│  - Feedback system                       │
│  - Search and filtering                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      SharePoint Lists (Data Layer)       │
│  - LDC_Projects                          │
│  - LDC_Tasks                             │
│  - LDC_Feedback                          │
│  - LDC_Settings                          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    M365 Security & Governance            │
│  - Azure AD authentication               │
│  - SharePoint permissions                │
│  - Audit logs & compliance               │
└─────────────────────────────────────────┘
```

## Key Features

### ✅ No Admin Rights Required
- Runs within standard M365 user permissions
- No macro security issues
- No special installations needed

### ✅ Data Stays in Your Tenant
- All data stored in SharePoint lists
- Inherits your org's security policies
- Automatic audit trails and version history
- Compliant with data governance requirements

### ✅ Multi-User Collaboration
- Concurrent users without conflicts
- Real-time updates
- Proper Azure AD authentication
- User-based permissions

### ✅ Mobile Ready
- Works on phones and tablets
- Responsive design
- Offline capabilities (limited)

### ✅ Modern UI/UX
- Web-app-like experience
- Navigation panel
- Dashboard with KPIs
- Search and filtering
- Intuitive forms

## What's Included

### 📁 SharePoint Lists
- **Projects** - Construction projects with status, dates, budget, risk
- **Tasks** - Action items linked to projects with assignments
- **Feedback** - User feedback and feature requests (FB-XXX format)
- **Settings** - Application configuration

### 📱 Power Apps Screens
- **Dashboard** - KPI cards, recent projects, quick actions
- **Projects List** - Searchable, filterable project list
- **Project Detail** - Full project view with linked tasks
- **Tasks List** - All tasks with filtering
- **Feedback** - Submit and manage feedback
- **Forms** - Create/edit projects and tasks

### 📜 Scripts & Tools
- PowerShell script to create SharePoint lists
- JSON schemas for all lists
- Deployment documentation

## Quick Start

### Prerequisites
- Microsoft 365 account with Power Apps access
- SharePoint site where you have contribute permissions
- Power Apps license (included in most M365 plans)

### Installation Steps

**1. Create SharePoint Lists**

Option A: Using PowerShell (recommended)
```powershell
cd powerapps-sharepoint/scripts
.\Create-SharePoint-Lists.ps1
```

Option B: Manual creation
- Follow the schemas in `sharepoint-lists/` folder
- Create each list manually in SharePoint
- See `docs/DEPLOYMENT-GUIDE.md` for detailed steps

**2. Import Power Apps Package**
- Open Power Apps Studio (make.powerapps.com)
- Import the app package (when available)
- Connect to your SharePoint lists
- Publish the app

**3. Configure Permissions**
- Set SharePoint list permissions
- Add users to the app
- Test with a few users first

**4. Deploy to Users**
- Share the app via Power Apps
- Embed in SharePoint page
- Add to Microsoft Teams

See `docs/DEPLOYMENT-GUIDE.md` for complete step-by-step instructions.

## File Structure

```
powerapps-sharepoint/
├── README.md                          # This file
├── sharepoint-lists/
│   ├── Projects-List-Schema.json      # Projects list definition
│   ├── Tasks-List-Schema.json         # Tasks list definition
│   ├── Feedback-List-Schema.json      # Feedback list definition
│   └── Settings-List-Schema.json      # Settings list definition
├── power-apps/
│   ├── App-Structure.yaml             # Complete app structure
│   ├── Formulas.md                    # Power Fx formulas reference
│   └── Components.md                  # Reusable components
├── scripts/
│   └── Create-SharePoint-Lists.ps1    # Automated list creation
└── docs/
    ├── DEPLOYMENT-GUIDE.md            # Step-by-step deployment
    ├── USER-GUIDE.md                  # End-user documentation
    └── ADMIN-GUIDE.md                 # Admin configuration
```

## Data Model

### Projects List (LDC_Projects)
- **Title** - Project name
- **ProjectNumber** - Unique identifier
- **Status** - Active, On Hold, Completed, Cancelled
- **ProjectOwner** - Person field
- **StartDate** / **DueDate** - Date fields
- **RiskLevel** - Low, Medium, High, Critical
- **PercentComplete** - 0-100
- **Budget** / **ActualCost** - Currency fields
- **Location** - Site address
- **ClientName** - Customer name
- **Description** - Project notes

### Tasks List (LDC_Tasks)
- **Title** - Task description
- **ProjectLookup** - Link to project
- **Status** - Not Started, In Progress, Completed, Blocked, Cancelled
- **AssignedTo** - Person field
- **Priority** - Low, Medium, High, Critical
- **StartDate** / **DueDate** / **CompletedDate**
- **EstimatedHours** / **ActualHours**
- **Description** - Task details
- **Category** - Planning, Design, Construction, etc.

### Feedback List (LDC_Feedback)
- **Title** - Feedback summary
- **FeedbackNumber** - FB-001, FB-002, etc.
- **FeedbackType** - Bug, Feature Request, Improvement, etc.
- **Status** - NEW, TRIAGED, IN_PROGRESS, RESOLVED, etc.
- **Priority** - LOW, MEDIUM, HIGH, URGENT
- **Requestor** - Person field
- **Description** - Detailed feedback
- **ResolutionComment** - Response/resolution
- **AssignedTo** - Person field
- **TargetVersion** - Release version

## Advantages Over Excel VBA

| Feature | Excel VBA | Power Apps + SharePoint |
|---------|-----------|------------------------|
| Admin rights | Often required | ❌ Not required |
| Multi-user | Single user | ✅ Concurrent users |
| Mobile | Desktop only | ✅ Full mobile support |
| Data governance | Manual | ✅ Automatic (M365) |
| Security | Macro risks | ✅ Azure AD + SharePoint |
| Updates | File redistribution | ✅ Central update |
| Audit trails | None | ✅ Built-in |
| Integration | Limited | ✅ Power Automate, Teams |

## Support & Troubleshooting

### Common Issues

**"I don't have Power Apps"**
- Check your M365 license - most include Power Apps
- Contact your IT admin for access
- Power Apps is included in E3, E5, Business Premium

**"Can't create SharePoint lists"**
- Verify you have contribute permissions on the site
- Ask site owner to create lists for you
- Use the PowerShell script if you have permissions

**"App won't connect to lists"**
- Ensure list names match exactly (LDC_Projects, etc.)
- Check SharePoint site URL is correct
- Verify you have read access to the lists

**"Data not showing"**
- Refresh the data sources in Power Apps
- Check list permissions
- Verify lists have data

### Getting Help

1. Review `docs/DEPLOYMENT-GUIDE.md` for detailed steps
2. Check `docs/USER-GUIDE.md` for usage instructions
3. Review Power Fx formulas in `power-apps/Formulas.md`
4. Contact your M365 admin for permissions issues

## Customization

### Branding
- Update colors in theme section of `App-Structure.yaml`
- Add your company logo to header
- Customize field labels and choices

### Fields
- Add custom fields to SharePoint lists
- Update Power Apps forms to include new fields
- Modify validation rules as needed

### Workflows
- Use Power Automate for notifications
- Create approval workflows
- Automate status updates

## Security & Permissions

### SharePoint Lists
- Inherit permissions from parent site (default)
- Or set custom permissions per list
- Recommend: Contributors can add/edit, Members can view

### Power Apps
- Share app with specific users or groups
- Set as Featured app for easy access
- Embed in SharePoint or Teams for discoverability

### Data Governance
- All data stays in your M365 tenant
- Automatic audit logs via SharePoint
- Version history on all list items
- Retention policies apply automatically

## Migration from Web Version

If migrating from the Next.js web app:

1. Export data from PostgreSQL database
2. Format as CSV files
3. Import to SharePoint lists
4. Map user accounts to M365 users
5. Test thoroughly before cutover

See `docs/MIGRATION-GUIDE.md` for detailed steps.

## Roadmap

### Phase 1: Core Functionality ✅
- SharePoint lists created
- Basic Power Apps structure
- Dashboard and navigation
- Projects and tasks CRUD

### Phase 2: Enhanced Features (In Progress)
- Advanced search and filtering
- Bulk operations
- Export to Excel
- Power Automate workflows

### Phase 3: Integrations
- Teams integration
- Outlook calendar sync
- Power BI reports
- Document libraries

### Phase 4: Mobile Optimization
- Offline mode improvements
- Mobile-specific layouts
- Push notifications
- Camera integration for photos

## License

Internal use only. Not for redistribution.

## Version History

- **2.0.0** - Initial Power Apps + SharePoint release
- Migrated from Next.js web app
- Self-contained M365 solution
- No external dependencies

---

**Status:** Ready for deployment  
**Platform:** Microsoft 365 (Power Apps + SharePoint)  
**Last Updated:** 2026-02-26
