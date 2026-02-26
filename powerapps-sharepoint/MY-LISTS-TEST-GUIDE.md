# My Lists Testing Guide - LDC Tools

**Testing Location:** Your Personal "My Lists" workspace  
**Purpose:** Test the SharePoint list structure before deploying to production  
**Time:** ~80 minutes

---

## Why Test in My Lists?

- ✅ Private workspace - only you can see it
- ✅ Safe to experiment and make mistakes
- ✅ Easy to delete and restart
- ✅ Learn the process before production deployment
- ✅ Prove the concept works

---

## Step 1: Access My Lists

### Option A: Direct URL
```
https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx
```

### Option B: From SharePoint
1. Go to SharePoint home: `https://jwsite.sharepoint.com`
2. Click your profile icon (top right)
3. Look for "My Lists" or "My Content"

### Option C: From Microsoft 365
1. Go to office.com
2. Click the app launcher (9 dots, top left)
3. Click "Lists"
4. This opens your personal lists area

**You should see:** A page titled "My lists" with a "+ New list" button

---

## Step 2: Create Test Lists

Follow the exact same process as the manual deployment checklist, but create in "My Lists" instead of the site.

### Quick Navigation

For each list creation:
1. Click **+ New list**
2. Choose **Blank list**
3. Name it (use same names: LDC_Projects, LDC_Tasks, etc.)
4. Click **Create**
5. Add columns as specified below

---

## Phase 1: Create LDC_Projects (20 min)

### Create the List
1. Click **+ New list**
2. Choose **Blank list**
3. Name: `LDC_Projects`
4. Description: `TEST - Construction projects`
5. Click **Create**

### Rename Title Column
1. Click **Title** column header
2. **Column settings** > **Rename**
3. Change to: `Project Name`

### Add These Columns

Click **+ Add column** for each:

| # | Name | Type | Settings |
|---|------|------|----------|
| 1 | ProjectNumber | Text | Max: 50 |
| 2 | Status | Choice | Active, On Hold, Completed, Cancelled (Default: Active) |
| 3 | ProjectOwner | Person | Single, Required |
| 4 | StartDate | Date and time | Date only, Required |
| 5 | DueDate | Date and time | Date only, Required |
| 6 | RiskLevel | Choice | Low, Medium, High, Critical (Default: Low) |
| 7 | PercentComplete | Number | Min: 0, Max: 100, Decimals: 0, Default: 0 |
| 8 | Budget | Currency | Min: 0, Decimals: 2 |
| 9 | ActualCost | Currency | Min: 0, Decimals: 2 |
| 10 | Location | Text | Max: 255 |
| 11 | ClientName | Text | Max: 255 |
| 12 | Description | Multiple lines | Plain text |
| 13 | Tags | Text | Max: 255 |

**Checklist:**
- [ ] All 13 columns added
- [ ] Choice fields have correct options
- [ ] Number fields have min/max set
- [ ] Required fields marked

---

## Phase 2: Create LDC_Tasks (25 min)

### Create the List
1. Click **+ New list**
2. Choose **Blank list**
3. Name: `LDC_Tasks`
4. Description: `TEST - Tasks for projects`
5. Click **Create**

### Rename Title Column
1. Rename **Title** to `Task Title`

### Add These Columns

| # | Name | Type | Settings |
|---|------|------|----------|
| 1 | ProjectLookup | Lookup | **Get info from:** LDC_Projects<br>**In this column:** Title<br>**Required:** Yes |
| 2 | Status | Choice | Not Started, In Progress, Completed, Blocked, Cancelled (Default: Not Started) |
| 3 | AssignedTo | Person | Single, Required |
| 4 | Priority | Choice | Low, Medium, High, Critical (Default: Medium) |
| 5 | StartDate | Date and time | Date only |
| 6 | DueDate | Date and time | Date only |
| 7 | CompletedDate | Date and time | Include time |
| 8 | EstimatedHours | Number | Min: 0, Decimals: 1 |
| 9 | ActualHours | Number | Min: 0, Decimals: 1 |
| 10 | Description | Multiple lines | Plain text |
| 11 | BlockerReason | Multiple lines | Plain text |
| 12 | Category | Choice | Planning, Design, Procurement, Construction, Inspection, Documentation, Other |

**Important for ProjectLookup:**
- Click **+ Add column** > **Lookup**
- **Get information from:** Select `LDC_Projects`
- **In this column:** Select `Title`
- Check **Required**

**Checklist:**
- [ ] All 12 columns added
- [ ] ProjectLookup connects to LDC_Projects
- [ ] Choice fields have all options
- [ ] Date fields configured correctly

---

## Phase 3: Create LDC_Feedback (20 min)

### Create the List
1. Click **+ New list**
2. Choose **Blank list**
3. Name: `LDC_Feedback`
4. Description: `TEST - User feedback`
5. Click **Create**

### Rename Title Column
1. Rename **Title** to `Feedback Title`

### Add These Columns

| # | Name | Type | Settings |
|---|------|------|----------|
| 1 | FeedbackNumber | Text | Max: 20 |
| 2 | FeedbackType | Choice | Bug Report, Feature Request, Improvement, Question, Other (Default: Feature Request) |
| 3 | Status | Choice | NEW, TRIAGED, IN_PROGRESS, RESOLVED, WONT_FIX, DUPLICATE (Default: NEW) |
| 4 | Priority | Choice | LOW, MEDIUM, HIGH, URGENT (Default: MEDIUM) |
| 5 | Requestor | Person | Single, Required |
| 6 | RequestorName | Text | Max: 255 |
| 7 | Description | Multiple lines | Rich text, Required |
| 8 | ResolutionComment | Multiple lines | Rich text |
| 9 | AssignedTo | Person | Single |
| 10 | TargetVersion | Text | Max: 50 |
| 11 | ResolvedDate | Date and time | Include time |
| 12 | RelatedProject | Lookup | Get info from: LDC_Projects, In this column: Title |
| 13 | Votes | Number | Min: 0, Decimals: 0, Default: 0 |

**Checklist:**
- [ ] All 13 columns added
- [ ] RelatedProject lookup configured
- [ ] Rich text enabled for Description
- [ ] Status choices in CAPS

---

## Phase 4: Create LDC_Settings (10 min)

### Create the List
1. Click **+ New list**
2. Choose **Blank list**
3. Name: `LDC_Settings`
4. Description: `TEST - App settings`
5. Click **Create**

### Rename Title Column
1. Rename **Title** to `Setting Key`

### Add These Columns

| # | Name | Type | Settings |
|---|------|------|----------|
| 1 | SettingValue | Multiple lines | Plain text |
| 2 | SettingType | Choice | Text, Number, Boolean, JSON, URL (Default: Text) |
| 3 | Category | Choice | General, Display, Notifications, Integration, Advanced (Default: General) |
| 4 | Description | Multiple lines | Plain text |
| 5 | IsActive | Yes/No | Default: Yes |

### Add Default Settings

Click **+ New** and add these 5 items:

| Setting Key | SettingValue | SettingType | Category | Description | IsActive |
|-------------|--------------|-------------|----------|-------------|----------|
| AppVersion | 2.0.0 | Text | General | Current application version | Yes |
| DefaultProjectStatus | Active | Text | General | Default status for new projects | Yes |
| DefaultTaskStatus | Not Started | Text | General | Default status for new tasks | Yes |
| FeedbackNumberPrefix | FB | Text | General | Prefix for feedback numbers | Yes |
| EnableNotifications | true | Boolean | Notifications | Enable email notifications | Yes |

**Checklist:**
- [ ] All 5 columns added
- [ ] All 5 default settings created

---

## Phase 5: Test with Sample Data (15 min)

### Create Test Project

1. Open **LDC_Projects**
2. Click **+ New**
3. Fill in:
   - **Project Name:** "CG 01.12 Test Project"
   - **ProjectNumber:** "TEST-001"
   - **Status:** Active
   - **ProjectOwner:** (select yourself)
   - **StartDate:** (today's date)
   - **DueDate:** (one month from today)
   - **RiskLevel:** Low
   - **PercentComplete:** 25
   - **Budget:** $50,000
   - **Location:** "Zone 01"
   - **ClientName:** "Test Client"
   - **Description:** "This is a test project to verify the system works"
4. Click **Save**

### Create Test Tasks

Create 3 tasks linked to your test project:

**Task 1:**
1. Open **LDC_Tasks**
2. Click **+ New**
3. Fill in:
   - **Task Title:** "Site preparation"
   - **ProjectLookup:** Select "CG 01.12 Test Project"
   - **Status:** In Progress
   - **AssignedTo:** (yourself)
   - **Priority:** High
   - **DueDate:** (one week from today)
   - **EstimatedHours:** 40
   - **Category:** Construction
4. Click **Save**

**Task 2:**
- **Task Title:** "Foundation work"
- **ProjectLookup:** "CG 01.12 Test Project"
- **Status:** Not Started
- **Priority:** High
- **Category:** Construction

**Task 3:**
- **Task Title:** "Review plans"
- **ProjectLookup:** "CG 01.12 Test Project"
- **Status:** Completed
- **Priority:** Medium
- **CompletedDate:** (today)
- **Category:** Planning

### Create Test Feedback

1. Open **LDC_Feedback**
2. Click **+ New**
3. Fill in:
   - **Feedback Title:** "Add photo upload feature"
   - **FeedbackNumber:** "FB-001"
   - **FeedbackType:** Feature Request
   - **Status:** NEW
   - **Priority:** MEDIUM
   - **Requestor:** (yourself)
   - **Description:** "Would be great to upload photos of the construction site"
4. Click **Save**

### Verification Checklist

- [ ] Test project created successfully
- [ ] 3 test tasks created and linked to project
- [ ] Tasks show project name in ProjectLookup column
- [ ] Test feedback item created
- [ ] All data saving correctly
- [ ] Can edit items
- [ ] Can filter and sort

---

## Phase 6: Test Power Apps Connection (Optional)

If you want to test Power Apps before production:

1. Go to https://make.powerapps.com
2. Click **+ Create** > **Blank app** > **Tablet**
3. Name: "LDC Tools Test"
4. Click **Data** > **+ Add data**
5. Search for "SharePoint"
6. Connect to: `https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx`
7. Select your test lists:
   - LDC_Projects
   - LDC_Tasks
   - LDC_Feedback
   - LDC_Settings
8. Click **Connect**

**Test basic functionality:**
- Insert a Gallery showing projects
- Insert a Form to create new project
- Test that data flows correctly

---

## Phase 7: Document Your Findings

As you test, note:

**What worked well:**
- (List things that were easy/smooth)

**What was confusing:**
- (List any steps that were unclear)

**Issues encountered:**
- (List any errors or problems)

**Time taken:**
- Phase 1: ___ minutes
- Phase 2: ___ minutes
- Phase 3: ___ minutes
- Phase 4: ___ minutes
- Phase 5: ___ minutes
- Total: ___ minutes

**Recommendations for production:**
- (Any changes you'd make)

---

## Phase 8: When Ready for Production

Once you've tested and are confident:

### Option 1: Recreate in Production Site
1. Go to the actual SharePoint site
2. Create the same 4 lists
3. Add the same columns
4. Manually copy over any data you want to keep

### Option 2: Export/Import (Advanced)
1. Use PowerShell or third-party tools to export list structure
2. Import to production site
3. This is more complex but faster for large datasets

### Option 3: Keep Test Lists
1. Leave test lists in "My Lists" for ongoing testing
2. Create production lists separately
3. Use test environment for training new users

---

## Troubleshooting

### "Can't find My Lists"
- Try direct URL: `https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx`
- Or go to office.com > Lists app
- Or create in OneDrive

### "Lookup column not working"
- Make sure LDC_Projects list exists first
- Refresh the page
- Try creating the lookup again

### "Can't create certain columns"
- Some features may be restricted
- Try a different column type
- Contact IT if consistently blocked

### "Lost my test lists"
- Check "My Lists" or "My Content"
- Check OneDrive > Lists
- Lists don't expire but can be deleted

---

## Quick Reference

**Your Test Location:**
```
https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx
```

**Lists to Create:**
1. LDC_Projects (14 columns total including Title)
2. LDC_Tasks (13 columns total including Title)
3. LDC_Feedback (14 columns total including Title)
4. LDC_Settings (6 columns total including Title)

**Total Columns:** 47 columns across 4 lists

**Test Data:**
- 1 project
- 3 tasks
- 1 feedback item
- 5 settings

---

## Next Steps After Testing

1. **Review your notes** - What worked? What didn't?
2. **Decide on production deployment** - Same structure or modifications?
3. **Plan rollout** - Just CG 01.12 or multiple groups?
4. **Create production lists** - Use the main deployment checklist
5. **Build Power Apps** - Follow the app structure guide
6. **Train users** - Use your test environment for demos

---

**Ready to start testing? Begin with Phase 1!** ✅

**Estimated total time:** 80-100 minutes including testing
