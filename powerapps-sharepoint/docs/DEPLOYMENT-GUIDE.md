# LDC Tools Power Apps - Deployment Guide

## Complete Step-by-Step Deployment Instructions

This guide walks you through deploying LDC Tools as a Power Apps + SharePoint solution in your M365 tenant.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Microsoft 365 account with Power Apps access
- [ ] SharePoint site with contribute permissions
- [ ] Power Apps license (check at make.powerapps.com)
- [ ] PowerShell 7+ installed (for automated setup)
- [ ] PnP PowerShell module (optional, for automation)

## Deployment Overview

```
Step 1: Prepare SharePoint Site (15 min)
    ↓
Step 2: Create SharePoint Lists (30 min automated, 60 min manual)
    ↓
Step 3: Build Power Apps Application (60-90 min)
    ↓
Step 4: Configure Connections (15 min)
    ↓
Step 5: Test Application (30 min)
    ↓
Step 6: Deploy to Users (15 min)
```

**Total Time:** 2.5-4 hours depending on method

---

## Step 1: Prepare SharePoint Site

### 1.1 Choose or Create SharePoint Site

**Option A: Use Existing Site**
1. Navigate to your SharePoint site
2. Verify you have contribute or owner permissions
3. Note the site URL (e.g., `https://yourtenant.sharepoint.com/sites/YourSite`)

**Option B: Create New Site**
1. Go to SharePoint home
2. Click "+ Create site"
3. Choose "Team site"
4. Name: "LDC Tools" or your preferred name
5. Add members who will use the app
6. Click "Finish"
7. Note the site URL

### 1.2 Create Lists Folder (Optional)

For organization, create a folder to hold your lists:
1. Go to Site Contents
2. You'll create lists directly here in the next step

---

## Step 2: Create SharePoint Lists

You have two options: **Automated** (PowerShell) or **Manual** (UI).

### Option A: Automated Setup with PowerShell (Recommended)

**Prerequisites:**
```powershell
# Install PnP PowerShell module
Install-Module -Name PnP.PowerShell -Scope CurrentUser
```

**Run the script:**
```powershell
# Navigate to scripts folder
cd powerapps-sharepoint/scripts

# Edit the script to set your site URL
# Update line 12: $SiteUrl = "https://yourtenant.sharepoint.com/sites/YourSite"

# Run the script
.\Create-SharePoint-Lists.ps1
```

**What the script does:**
- Connects to your SharePoint site
- Creates all 4 lists (Projects, Tasks, Feedback, Settings)
- Adds all custom columns
- Creates lookup relationships
- Seeds default settings data
- Creates default views

**Expected output:**
```
Connecting to SharePoint site...
PHASE 1: Creating lists and basic fields...
  Creating list: LDC_Projects
  Adding custom fields...
  List 'LDC_Projects' created successfully!
  
  Creating list: LDC_Tasks
  ...
  
PHASE 2: Creating lookup fields...
  Creating lookup fields for: LDC_Tasks
  
PHASE 3: Seeding default data...
  Adding default settings...
  
SharePoint Lists Created Successfully!
```

**If errors occur:**
- Verify site URL is correct
- Check you have contribute permissions
- Ensure PnP PowerShell is installed
- Try manual creation (Option B)

### Option B: Manual List Creation

If PowerShell doesn't work, create lists manually:

#### 2.1 Create Projects List

1. Go to Site Contents > + New > List
2. Name: `LDC_Projects`
3. Description: "Construction projects managed in LDC Tools"
4. Click "Create"

**Add columns:**

| Column Name | Type | Settings |
|-------------|------|----------|
| ProjectNumber | Single line of text | Max 50 chars |
| Status | Choice | Active, On Hold, Completed, Cancelled (Default: Active) |
| ProjectOwner | Person | Single selection, Required |
| StartDate | Date | Date only, Required |
| DueDate | Date | Date only, Required |
| RiskLevel | Choice | Low, Medium, High, Critical (Default: Low) |
| PercentComplete | Number | Min: 0, Max: 100, Decimals: 0, Default: 0 |
| Budget | Currency | Min: 0, Decimals: 2 |
| ActualCost | Currency | Min: 0, Decimals: 2 |
| Location | Single line of text | Max 255 chars |
| ClientName | Single line of text | Max 255 chars |
| Description | Multiple lines of text | Plain text |
| Tags | Single line of text | Max 255 chars |

**To add a column:**
1. Click "+ Add column"
2. Select column type
3. Enter column name
4. Configure settings
5. Click "Save"

**Create views:**
1. Click "All Items" dropdown > "Create new view"
2. Name: "Active Projects"
3. Filter: Status equals Active
4. Sort: DueDate ascending
5. Save

#### 2.2 Create Tasks List

1. Go to Site Contents > + New > List
2. Name: `LDC_Tasks`
3. Description: "Tasks and action items for LDC construction projects"
4. Click "Create"

**Add columns:**

| Column Name | Type | Settings |
|-------------|------|----------|
| ProjectLookup | Lookup | Lookup to LDC_Projects, Show: Title, Required |
| Status | Choice | Not Started, In Progress, Completed, Blocked, Cancelled (Default: Not Started) |
| AssignedTo | Person | Single selection, Required |
| Priority | Choice | Low, Medium, High, Critical (Default: Medium) |
| StartDate | Date | Date only |
| DueDate | Date | Date only |
| CompletedDate | Date and Time | Date and time |
| EstimatedHours | Number | Min: 0, Decimals: 1 |
| ActualHours | Number | Min: 0, Decimals: 1 |
| Description | Multiple lines of text | Plain text |
| BlockerReason | Multiple lines of text | Plain text |
| Category | Choice | Planning, Design, Procurement, Construction, Inspection, Documentation, Other |

**Create views:**
- "My Tasks" - Filter: AssignedTo equals [Me], Sort: DueDate
- "Open Tasks" - Filter: Status not equal to Completed AND Cancelled
- "Overdue Tasks" - Filter: DueDate less than [Today] AND Status not Completed

#### 2.3 Create Feedback List

1. Go to Site Contents > + New > List
2. Name: `LDC_Feedback`
3. Description: "User feedback and feature requests for LDC Tools"
4. Click "Create"

**Add columns:**

| Column Name | Type | Settings |
|-------------|------|----------|
| FeedbackNumber | Single line of text | Max 20 chars, Indexed |
| FeedbackType | Choice | Bug Report, Feature Request, Improvement, Question, Other (Default: Feature Request) |
| Status | Choice | NEW, TRIAGED, IN_PROGRESS, RESOLVED, WONT_FIX, DUPLICATE (Default: NEW) |
| Priority | Choice | LOW, MEDIUM, HIGH, URGENT (Default: MEDIUM) |
| Requestor | Person | Single selection, Required |
| RequestorName | Single line of text | Max 255 chars |
| Description | Multiple lines of text | Rich text, Required |
| ResolutionComment | Multiple lines of text | Rich text |
| AssignedTo | Person | Single selection |
| TargetVersion | Single line of text | Max 50 chars |
| ResolvedDate | Date and Time | Date and time |
| RelatedProject | Lookup | Lookup to LDC_Projects, Show: Title |
| Votes | Number | Min: 0, Decimals: 0, Default: 0 |

#### 2.4 Create Settings List

1. Go to Site Contents > + New > List
2. Name: `LDC_Settings`
3. Description: "Application settings and configuration for LDC Tools"
4. Click "Create"

**Add columns:**

| Column Name | Type | Settings |
|-------------|------|----------|
| SettingValue | Multiple lines of text | Plain text |
| SettingType | Choice | Text, Number, Boolean, JSON, URL (Default: Text) |
| Category | Choice | General, Display, Notifications, Integration, Advanced (Default: General) |
| Description | Multiple lines of text | Plain text |
| IsActive | Yes/No | Default: Yes |

**Add default settings:**

Click "+ New" and add these items:

| Title | SettingValue | SettingType | Category | Description | IsActive |
|-------|--------------|-------------|----------|-------------|----------|
| AppVersion | 2.0.0 | Text | General | Current application version | Yes |
| DefaultProjectStatus | Active | Text | General | Default status for new projects | Yes |
| DefaultTaskStatus | Not Started | Text | General | Default status for new tasks | Yes |
| FeedbackNumberPrefix | FB | Text | General | Prefix for feedback numbers | Yes |
| EnableNotifications | true | Boolean | Notifications | Enable email notifications | Yes |

---

## Step 3: Build Power Apps Application

### 3.1 Access Power Apps Studio

1. Go to https://make.powerapps.com
2. Sign in with your M365 account
3. Select your environment (usually your org name)
4. Click "+ Create" in left navigation

### 3.2 Create Canvas App

1. Click "Blank app"
2. Choose "Tablet" format (1366 x 768)
3. Name: "LDC Tools"
4. Click "Create"

### 3.3 Add Data Sources

1. Click "Data" in left panel
2. Click "+ Add data"
3. Search for "SharePoint"
4. Click "SharePoint"
5. Enter your SharePoint site URL
6. Select these lists:
   - LDC_Projects
   - LDC_Tasks
   - LDC_Feedback
   - LDC_Settings
7. Click "Connect"

**Verify connections:**
- All 4 lists should appear under "Data" panel
- If connection fails, check site URL and permissions

### 3.4 Build App Structure

Follow the detailed structure in `power-apps/App-Structure.yaml`:

**Create screens:**
1. Rename "Screen1" to "scrSplash"
2. Add new screens:
   - scrDashboard
   - scrProjectsList
   - scrProjectDetail
   - scrProjectForm
   - scrTasksList
   - scrTaskForm
   - scrFeedbackList

**For each screen:**
- Set OnVisible property (see App-Structure.yaml)
- Add controls as specified
- Configure formulas

### 3.5 Create Navigation Component

1. Insert > Custom > Component
2. Name: "cmpNavigation"
3. Width: 180, Height: Parent.Height
4. Add navigation buttons (see App-Structure.yaml for formulas)

### 3.6 Create Header Component

1. Insert > Custom > Component
2. Name: "cmpHeader"
3. Width: Parent.Width, Height: 60
4. Add header bar and title

### 3.7 Build Dashboard Screen

**Add KPI cards:**
1. Insert > Rectangle (for card background)
2. Insert > Label (for title and value)
3. Set formulas for calculations:
   - Total Projects: `CountRows(LDC_Projects)`
   - Open Tasks: `CountRows(Filter(LDC_Tasks, Status <> "Completed" && Status <> "Cancelled"))`
   - At Risk: `CountRows(Filter(LDC_Projects, RiskLevel = "High" || RiskLevel = "Critical"))`
   - Due This Week: `CountRows(Filter(LDC_Tasks, DueDate >= Today() && DueDate <= Today() + 7))`

**Add recent projects gallery:**
1. Insert > Gallery > Vertical
2. Items: `SortByColumns(Filter(LDC_Projects, Status = "Active"), "Modified", Descending)`
3. Add labels for project name, status, due date
4. Set OnSelect to navigate to project detail

### 3.8 Build Projects List Screen

1. Add search box: `TextInput` with HintText "Search projects..."
2. Add filter dropdown: `Dropdown` with status choices
3. Add gallery with filtered items:
   ```
   Filter(
     LDC_Projects,
     (IsBlank(txtSearch.Text) || txtSearch.Text in Title || txtSearch.Text in ProjectNumber) &&
     (IsBlank(ddFilterStatus.Selected.Value) || Status = ddFilterStatus.Selected.Value)
   )
   ```

### 3.9 Build Project Detail Screen

1. Add back button to return to list
2. Add display form showing project details
3. Add gallery showing related tasks:
   ```
   Filter(LDC_Tasks, ProjectLookup.Id = varSelectedProject.ID)
   ```

### 3.10 Build Forms

**Project Form:**
1. Insert > Forms > Edit
2. DataSource: LDC_Projects
3. Item: `varSelectedProject`
4. Add all fields
5. OnSuccess: `Navigate(scrProjectsList, ScreenTransition.None)`

**Task Form:**
1. Insert > Forms > Edit
2. DataSource: LDC_Tasks
3. Item: `varSelectedTask`
4. Add all fields
5. OnSuccess: `Navigate(scrTasksList, ScreenTransition.None)`

---

## Step 4: Configure App Settings

### 4.1 Set App Properties

1. Click "App" in tree view
2. Set OnStart:
   ```
   Set(varCurrentUser, User());
   Set(varCurrentScreen, "Dashboard");
   ```

### 4.2 Configure Theme

1. Click "App" > "Color" in properties
2. Set primary color: `RGBA(41, 98, 255, 1)`
3. Set hover color: `RGBA(31, 78, 235, 1)`

### 4.3 Enable Formulas

1. Settings > Upcoming features
2. Enable "Formula-level error management"
3. Enable "Enhanced data source experience"

---

## Step 5: Test Application

### 5.1 Test in Studio

1. Click "Play" button (▶) in top right
2. Test each screen:
   - Dashboard loads with correct KPIs
   - Navigation works
   - Projects list shows data
   - Search and filters work
   - Forms can create/edit items
   - Project detail shows tasks

### 5.2 Test Data Operations

**Create test project:**
1. Click "New Project"
2. Fill in all required fields
3. Save
4. Verify it appears in list

**Create test task:**
1. Click "New Task"
2. Link to test project
3. Assign to yourself
4. Save
5. Verify it appears in project detail

**Test filtering:**
1. Use search box
2. Use status filter
3. Verify results update

### 5.3 Fix Common Issues

**Data not showing:**
- Refresh data sources
- Check SharePoint list permissions
- Verify list names match exactly

**Forms not saving:**
- Check required fields are filled
- Verify data source connection
- Check for validation errors

**Navigation not working:**
- Verify screen names match
- Check Navigate() formulas
- Ensure variables are set

---

## Step 6: Publish and Deploy

### 6.1 Save and Publish

1. Click "File" > "Save"
2. Enter version notes
3. Click "Publish"
4. Click "Publish this version"

### 6.2 Share with Users

**Option A: Direct Sharing**
1. Click "Share" button
2. Enter user names or groups
3. Set permissions (Can use, Can edit)
4. Click "Share"

**Option B: Embed in SharePoint**
1. Go to your SharePoint site
2. Edit page or create new page
3. Add "Power Apps" web part
4. Select "LDC Tools" app
5. Publish page

**Option C: Add to Teams**
1. Open Microsoft Teams
2. Click "..." > "More apps"
3. Search for "Power Apps"
4. Click "Add to a team"
5. Select your team
6. Choose "LDC Tools" app

### 6.3 Set as Featured App

1. In Power Apps admin center
2. Go to Featured apps
3. Add "LDC Tools"
4. Users will see it prominently

---

## Step 7: Post-Deployment

### 7.1 Monitor Usage

1. Power Apps analytics dashboard
2. SharePoint list activity
3. User feedback

### 7.2 Iterate and Improve

1. Collect user feedback
2. Add to Feedback list
3. Prioritize enhancements
4. Update app regularly

### 7.3 Backup and Maintenance

**Backup:**
- Export Power Apps package monthly
- SharePoint has automatic versioning
- Document any customizations

**Maintenance:**
- Review and archive old projects
- Clean up completed tasks
- Update settings as needed

---

## Troubleshooting

### "Can't connect to SharePoint"
- Verify site URL is correct
- Check you have read permissions
- Try reconnecting data source

### "Lists not found"
- Ensure list names match exactly (case-sensitive)
- Verify lists exist in SharePoint
- Check you're connected to correct site

### "Permission denied"
- Check SharePoint list permissions
- Verify you have contribute access
- Ask site owner to grant permissions

### "App won't publish"
- Check for errors in formulas
- Verify all required fields
- Save before publishing

### "Users can't see app"
- Verify app is shared with users
- Check user licenses
- Ensure app is published

---

## Next Steps

After successful deployment:

1. **Train Users** - Create user guide, hold training session
2. **Migrate Data** - Import existing projects and tasks
3. **Customize** - Add company branding, custom fields
4. **Automate** - Create Power Automate workflows
5. **Monitor** - Track usage and gather feedback

---

## Support Resources

- Power Apps Documentation: https://docs.microsoft.com/powerapps
- SharePoint Help: https://support.microsoft.com/sharepoint
- Power Fx Formula Reference: https://docs.microsoft.com/power-platform/power-fx
- Community Forums: https://powerusers.microsoft.com

---

**Deployment Status Checklist:**

- [ ] SharePoint site prepared
- [ ] All 4 lists created
- [ ] Power Apps created
- [ ] Data sources connected
- [ ] All screens built
- [ ] Navigation working
- [ ] Forms functional
- [ ] Testing complete
- [ ] App published
- [ ] Users added
- [ ] Training completed

**Congratulations! Your LDC Tools Power Apps solution is deployed!** 🎉
