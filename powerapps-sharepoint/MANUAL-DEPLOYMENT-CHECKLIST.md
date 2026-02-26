# Manual Deployment Checklist

**Site URL:** `https://jwsite.sharepoint.com/sites/USA-LDC-PersonnelZone01-Team`

## Overview

Since PowerShell automation isn't available, you'll create the SharePoint lists manually through the SharePoint UI. This takes about 60-90 minutes but works in any environment.

**Estimated Time:** 60-90 minutes  
**Difficulty:** Easy (just repetitive)

---

## Pre-Flight Checklist

- [ ] You have access to the SharePoint site
- [ ] You have "Contribute" or "Owner" permissions
- [ ] You can create new lists (test: Site Contents > + New > List)
- [ ] You have the schema files open for reference

---

## Phase 1: Create Projects List (20 min)

### Step 1.1: Create the List

1. Go to: `https://jwsite.sharepoint.com/sites/USA-LDC-PersonnelZone01-Team`
2. Click **Site Contents** (left navigation or gear icon > Site Contents)
3. Click **+ New** > **List**
4. Choose **Blank list**
5. Name: `LDC_Projects`
6. Description: `Construction projects managed in LDC Tools`
7. Click **Create**

### Step 1.2: Add Columns

**The "Title" column already exists - just rename it:**
1. Click on **Title** column header > **Column settings** > **Rename**
2. Change to: `Project Name`

**Now add these columns (click "+ Add column" for each):**

| # | Column Name | Type | Settings |
|---|-------------|------|----------|
| 1 | ProjectNumber | Text | Max length: 50 |
| 2 | Status | Choice | Choices: Active, On Hold, Completed, Cancelled<br>Default: Active |
| 3 | ProjectOwner | Person | Allow multiple: No<br>Required: Yes |
| 4 | StartDate | Date and time | Date only<br>Required: Yes |
| 5 | DueDate | Date and time | Date only<br>Required: Yes |
| 6 | RiskLevel | Choice | Choices: Low, Medium, High, Critical<br>Default: Low |
| 7 | PercentComplete | Number | Min: 0, Max: 100<br>Decimals: 0<br>Default: 0 |
| 8 | Budget | Currency | Min: 0<br>Decimals: 2 |
| 9 | ActualCost | Currency | Min: 0<br>Decimals: 2 |
| 10 | Location | Text | Max length: 255 |
| 11 | ClientName | Text | Max length: 255 |
| 12 | Description | Multiple lines of text | Plain text |
| 13 | Tags | Text | Max length: 255 |

**How to add a column:**
1. Click **+ Add column**
2. Select the type (Text, Choice, Person, etc.)
3. Enter the column name
4. Configure settings (see table above)
5. Click **Save**
6. Repeat for all 13 columns

**Checklist:**
- [ ] ProjectNumber added
- [ ] Status added (with 4 choices)
- [ ] ProjectOwner added
- [ ] StartDate added
- [ ] DueDate added
- [ ] RiskLevel added (with 4 choices)
- [ ] PercentComplete added
- [ ] Budget added
- [ ] ActualCost added
- [ ] Location added
- [ ] ClientName added
- [ ] Description added
- [ ] Tags added

### Step 1.3: Create Views (Optional but Recommended)

**Active Projects View:**
1. Click **All Items** dropdown > **Create new view**
2. Name: `Active Projects`
3. Filter: Where **Status** is equal to **Active**
4. Sort: **DueDate** ascending
5. Click **OK**

**At Risk View:**
1. Create new view
2. Name: `At Risk`
3. Filter: Where **RiskLevel** is equal to **High** OR **Critical**
4. Sort: **DueDate** ascending
5. Click **OK**

---

## Phase 2: Create Tasks List (25 min)

### Step 2.1: Create the List

1. Go to **Site Contents**
2. Click **+ New** > **List**
3. Choose **Blank list**
4. Name: `LDC_Tasks`
5. Description: `Tasks and action items for LDC construction projects`
6. Click **Create**

### Step 2.2: Rename Title Column

1. Click **Title** column > **Column settings** > **Rename**
2. Change to: `Task Title`

### Step 2.3: Add Columns

| # | Column Name | Type | Settings |
|---|-------------|------|----------|
| 1 | ProjectLookup | Lookup | Get info from: LDC_Projects<br>In this column: Title<br>Required: Yes |
| 2 | Status | Choice | Choices: Not Started, In Progress, Completed, Blocked, Cancelled<br>Default: Not Started |
| 3 | AssignedTo | Person | Allow multiple: No<br>Required: Yes |
| 4 | Priority | Choice | Choices: Low, Medium, High, Critical<br>Default: Medium |
| 5 | StartDate | Date and time | Date only |
| 6 | DueDate | Date and time | Date only |
| 7 | CompletedDate | Date and time | Include time: Yes |
| 8 | EstimatedHours | Number | Min: 0<br>Decimals: 1 |
| 9 | ActualHours | Number | Min: 0<br>Decimals: 1 |
| 10 | Description | Multiple lines of text | Plain text |
| 11 | BlockerReason | Multiple lines of text | Plain text |
| 12 | Category | Choice | Choices: Planning, Design, Procurement, Construction, Inspection, Documentation, Other |

**Important for ProjectLookup:**
- Type: **Lookup**
- Click **+ Add column** > **Lookup**
- Get information from: Select **LDC_Projects**
- In this column: Select **Title**
- Check **Required**

**Checklist:**
- [ ] ProjectLookup added (lookup to LDC_Projects)
- [ ] Status added (with 5 choices)
- [ ] AssignedTo added
- [ ] Priority added (with 4 choices)
- [ ] StartDate added
- [ ] DueDate added
- [ ] CompletedDate added
- [ ] EstimatedHours added
- [ ] ActualHours added
- [ ] Description added
- [ ] BlockerReason added
- [ ] Category added (with 7 choices)

### Step 2.4: Create Views (Optional)

**My Tasks:**
1. Create new view: `My Tasks`
2. Filter: Where **AssignedTo** is equal to **[Me]**
3. Sort: **DueDate** ascending

**Open Tasks:**
1. Create new view: `Open Tasks`
2. Filter: Where **Status** is not equal to **Completed** AND not equal to **Cancelled**
3. Sort: **Priority** descending, then **DueDate** ascending

---

## Phase 3: Create Feedback List (20 min)

### Step 3.1: Create the List

1. Go to **Site Contents**
2. Click **+ New** > **List**
3. Choose **Blank list**
4. Name: `LDC_Feedback`
5. Description: `User feedback and feature requests for LDC Tools`
6. Click **Create**

### Step 3.2: Rename Title Column

1. Click **Title** column > **Column settings** > **Rename**
2. Change to: `Feedback Title`

### Step 3.3: Add Columns

| # | Column Name | Type | Settings |
|---|-------------|------|----------|
| 1 | FeedbackNumber | Text | Max length: 20 |
| 2 | FeedbackType | Choice | Choices: Bug Report, Feature Request, Improvement, Question, Other<br>Default: Feature Request |
| 3 | Status | Choice | Choices: NEW, TRIAGED, IN_PROGRESS, RESOLVED, WONT_FIX, DUPLICATE<br>Default: NEW |
| 4 | Priority | Choice | Choices: LOW, MEDIUM, HIGH, URGENT<br>Default: MEDIUM |
| 5 | Requestor | Person | Allow multiple: No<br>Required: Yes |
| 6 | RequestorName | Text | Max length: 255 |
| 7 | Description | Multiple lines of text | Rich text: Yes<br>Required: Yes |
| 8 | ResolutionComment | Multiple lines of text | Rich text: Yes |
| 9 | AssignedTo | Person | Allow multiple: No |
| 10 | TargetVersion | Text | Max length: 50 |
| 11 | ResolvedDate | Date and time | Include time: Yes |
| 12 | RelatedProject | Lookup | Get info from: LDC_Projects<br>In this column: Title |
| 13 | Votes | Number | Min: 0<br>Decimals: 0<br>Default: 0 |

**Checklist:**
- [ ] FeedbackNumber added
- [ ] FeedbackType added (with 5 choices)
- [ ] Status added (with 6 choices)
- [ ] Priority added (with 4 choices)
- [ ] Requestor added
- [ ] RequestorName added
- [ ] Description added (rich text)
- [ ] ResolutionComment added (rich text)
- [ ] AssignedTo added
- [ ] TargetVersion added
- [ ] ResolvedDate added
- [ ] RelatedProject added (lookup to LDC_Projects)
- [ ] Votes added

### Step 3.4: Create Views (Optional)

**New Feedback:**
1. Create new view: `New Feedback`
2. Filter: Where **Status** is equal to **NEW**
3. Sort: **Priority** descending, then **Created** descending

**My Feedback:**
1. Create new view: `My Feedback`
2. Filter: Where **Requestor** is equal to **[Me]**
3. Sort: **Created** descending

---

## Phase 4: Create Settings List (10 min)

### Step 4.1: Create the List

1. Go to **Site Contents**
2. Click **+ New** > **List**
3. Choose **Blank list**
4. Name: `LDC_Settings`
5. Description: `Application settings and configuration for LDC Tools`
6. Click **Create**

### Step 4.2: Rename Title Column

1. Click **Title** column > **Column settings** > **Rename**
2. Change to: `Setting Key`

### Step 4.3: Add Columns

| # | Column Name | Type | Settings |
|---|-------------|------|----------|
| 1 | SettingValue | Multiple lines of text | Plain text |
| 2 | SettingType | Choice | Choices: Text, Number, Boolean, JSON, URL<br>Default: Text |
| 3 | Category | Choice | Choices: General, Display, Notifications, Integration, Advanced<br>Default: General |
| 4 | Description | Multiple lines of text | Plain text |
| 5 | IsActive | Yes/No | Default: Yes |

**Checklist:**
- [ ] SettingValue added
- [ ] SettingType added (with 5 choices)
- [ ] Category added (with 5 choices)
- [ ] Description added
- [ ] IsActive added

### Step 4.4: Add Default Settings

Click **+ New** and add these 5 items:

| Setting Key | SettingValue | SettingType | Category | Description | IsActive |
|-------------|--------------|-------------|----------|-------------|----------|
| AppVersion | 2.0.0 | Text | General | Current application version | Yes |
| DefaultProjectStatus | Active | Text | General | Default status for new projects | Yes |
| DefaultTaskStatus | Not Started | Text | General | Default status for new tasks | Yes |
| FeedbackNumberPrefix | FB | Text | General | Prefix for feedback numbers (e.g., FB-001) | Yes |
| EnableNotifications | true | Boolean | Notifications | Enable email notifications for task assignments | Yes |

**Checklist:**
- [ ] AppVersion added
- [ ] DefaultProjectStatus added
- [ ] DefaultTaskStatus added
- [ ] FeedbackNumberPrefix added
- [ ] EnableNotifications added

---

## Phase 5: Verification (5 min)

### Step 5.1: Check All Lists Exist

Go to **Site Contents** and verify you see:
- [ ] LDC_Projects
- [ ] LDC_Tasks
- [ ] LDC_Feedback
- [ ] LDC_Settings

### Step 5.2: Test Data Entry

**Create a test project:**
1. Open **LDC_Projects**
2. Click **+ New**
3. Fill in:
   - Project Name: "Test Project"
   - Status: Active
   - ProjectOwner: (select yourself)
   - StartDate: (today)
   - DueDate: (next week)
   - RiskLevel: Low
   - PercentComplete: 0
4. Click **Save**
5. Verify it appears in the list

**Create a test task:**
1. Open **LDC_Tasks**
2. Click **+ New**
3. Fill in:
   - Task Title: "Test Task"
   - ProjectLookup: (select "Test Project")
   - Status: Not Started
   - AssignedTo: (select yourself)
   - Priority: Medium
4. Click **Save**
5. Verify it appears in the list

**Checklist:**
- [ ] Test project created successfully
- [ ] Test task created successfully
- [ ] Task shows link to project
- [ ] All fields saving correctly

---

## Phase 6: Next Steps

### ✅ SharePoint Lists Complete!

Now you're ready to build the Power Apps application.

**Next:**
1. Open Power Apps Studio: https://make.powerapps.com
2. Follow `docs/DEPLOYMENT-GUIDE.md` starting at **Step 3: Build Power Apps Application**
3. Connect Power Apps to your SharePoint lists
4. Build the app screens using the structure in `power-apps/App-Structure.yaml`

**Estimated time to build Power Apps:** 60-90 minutes

---

## Troubleshooting

### "Can't create lists"
- Check you have Contribute or Owner permissions
- Ask site owner to grant permissions
- Try creating in a different SharePoint site

### "Lookup column not working"
- Ensure LDC_Projects list exists first
- Refresh the page and try again
- Make sure you select "LDC_Projects" from the dropdown

### "Can't add certain column types"
- Some column types require specific permissions
- Try a different column type or ask site owner

### "Lost track of where I am"
- Use this checklist to mark off completed items
- Each phase is independent - you can take breaks
- Lists are saved automatically

---

## Time Estimates

- **Phase 1 (Projects):** 20 minutes
- **Phase 2 (Tasks):** 25 minutes  
- **Phase 3 (Feedback):** 20 minutes
- **Phase 4 (Settings):** 10 minutes
- **Phase 5 (Verification):** 5 minutes

**Total:** ~80 minutes

---

## Quick Reference

**Your SharePoint Site:**
```
https://jwsite.sharepoint.com/sites/USA-LDC-PersonnelZone01-Team
```

**Lists to Create:**
1. LDC_Projects (14 columns)
2. LDC_Tasks (13 columns)
3. LDC_Feedback (14 columns)
4. LDC_Settings (6 columns)

**Total Columns:** 47 columns across 4 lists

---

**Ready to start? Begin with Phase 1!** ✅
