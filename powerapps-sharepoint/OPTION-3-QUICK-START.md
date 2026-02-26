# Option 3: Crew Change Request Form - Quick Start

**Goal:** Prove the Power Apps + SharePoint concept with a single, useful form  
**Time:** 5-10 hours total  
**Complexity:** Simple - One list, one form

---

## What This Delivers

A **Crew Change Request Form** that allows users to submit requests to:
- Add volunteers to crews
- Remove volunteers from crews
- Add volunteers to project rosters
- Add volunteers to both crew and project

This matches your web app's `CrewChangeRequest` model exactly.

---

## SharePoint List Schema

### Prerequisites: Supporting Lists

For the best user experience with dropdowns and filtering, create these helper lists first:

#### LDC_TradeTeams (Simple)
- **Title** (Text) - Trade team name (e.g., "Drywall", "Electrical")

#### LDC_TradeCrews (With Lookup)
- **Title** (Text) - Crew name (e.g., "Drywall Crew 1")
- **TradeTeam** (Lookup) - Lookup to LDC_TradeTeams → Title

#### LDC_Projects (Simple)
- **Title** (Text) - Project name

**Note:** You can skip these and use text fields instead if you want to start even simpler. The form will still work!

---

### LDC_CrewChangeRequests (Main List)

| Column Name | Type | Settings | Description |
|-------------|------|----------|-------------|
| Title | Text | Required | Auto-set to "Request by [Name]" |
| RequestType | Choice | Required | ADD_TO_CREW, REMOVE_FROM_CREW, ADD_TO_PROJECT_ROSTER, ADD_TO_CREW_AND_PROJECT |
| RequestorName | Text | Required, Max: 255 | Name of person making request |
| RequestorEmail | Text | Required, Max: 255 | Email of requestor |
| VolunteerName | Text | Required, Max: 255 | Name of volunteer being added/removed |
| VolunteerBaId | Text | Max: 50 | Builder Assistant ID |
| **TradeTeam** | **Lookup** | **Lookup to LDC_TradeTeams → Title** | **Trade team (dropdown)** |
| **Crew** | **Lookup** | **Lookup to LDC_TradeCrews → Title** | **Crew (filtered by trade team)** |
| **Project** | **Lookup** | **Lookup to LDC_Projects → Title** | **Project (dropdown)** |
| ProjectNameCustom | Text | Max: 255 | Custom project name if not in dropdown |
| Comments | Multiple lines | Plain text | Additional notes/context |
| Status | Choice | Required, Default: NEW | NEW, IN_PROGRESS, COMPLETED, REJECTED |
| AssignedTo | Person | Single | Person assigned to process request |
| ResolutionNotes | Multiple lines | Plain text | Admin notes on resolution |
| CompletedDate | Date/Time | Include time | When request was completed |
| ConstructionGroup | Text | Default: "CG 01.12" | Your construction group |

**Total:** 16 columns (including built-in Title, Created, Modified)

**Alternative (Text-Only Version):**
If you don't want to create the helper lists, replace the Lookup columns with Text:
- TradeTeam → Text (Max: 255)
- Crew → Text (Max: 255)  
- Project → Text (Max: 255)

You'll lose the dropdown filtering but the form will still work!

---

## Step-by-Step Setup (My Lists)

### Step 1: Create the List (5 min)

1. Go to: `https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx`
2. Click **+ New list**
3. Choose **Blank list**
4. Name: `LDC_CrewChangeRequests`
5. Description: `TEST - Crew change request submissions`
6. Click **Create**

### Step 2: Rename Title Column (1 min)

1. Click **Title** column header
2. **Column settings** > **Rename**
3. Change to: `Request Summary`

### Step 3: Create Helper Lists First (10 min)

**Option A: With Lookups (Recommended)**

Create these 3 simple lists:

**1. LDC_TradeTeams**
- Create blank list
- Rename Title to "Trade Team Name"
- Add sample data:
  - Drywall
  - Electrical
  - Plumbing
  - HVAC
  - Framing

**2. LDC_TradeCrews**
- Create blank list
- Rename Title to "Crew Name"
- Add column: **TradeTeam** (Lookup to LDC_TradeTeams → Title)
- Add sample data:
  - Drywall Crew 1 (TradeTeam: Drywall)
  - Drywall Crew 2 (TradeTeam: Drywall)
  - Electrical Crew 1 (TradeTeam: Electrical)

**3. LDC_Projects**
- Create blank list
- Rename Title to "Project Name"
- Add sample data:
  - Kingdom Hall - City Name
  - Assembly Hall Renovation

**Option B: Skip Lookups (Simpler)**

Skip this step and use text fields instead. Less fancy but faster to set up.

---

### Step 4: Add Columns to Main List (15 min)

Click **+ Add column** for each:

**1. RequestType** (Choice)
- Choices: 
  - ADD_TO_CREW
  - REMOVE_FROM_CREW
  - ADD_TO_PROJECT_ROSTER
  - ADD_TO_CREW_AND_PROJECT
- Required: Yes
- Default: ADD_TO_CREW

**2. RequestorName** (Text)
- Max length: 255
- Required: Yes

**3. RequestorEmail** (Text)
- Max length: 255
- Required: Yes

**4. VolunteerName** (Text)
- Max length: 255
- Required: Yes

**5. VolunteerBaId** (Text)
- Max length: 50

**6. TradeTeam** (Lookup) - *If using Option A*
- Get information from: LDC_TradeTeams
- In this column: Title

**7. Crew** (Lookup) - *If using Option A*
- Get information from: LDC_TradeCrews
- In this column: Title

**8. Project** (Lookup) - *If using Option A*
- Get information from: LDC_Projects
- In this column: Title

**9. ProjectNameCustom** (Text)
- Max length: 255

**Alternative for Option B (Text-Only):**
- **6. TradeTeam** (Text, Max: 255)
- **7. Crew** (Text, Max: 255)
- **8. Project** (Text, Max: 255)

**10. Comments** (Multiple lines of text)
- Plain text

**11. Status** (Choice)
- Choices: NEW, IN_PROGRESS, COMPLETED, REJECTED
- Required: Yes
- Default: NEW

**12. AssignedTo** (Person)
- Single selection

**13. ResolutionNotes** (Multiple lines of text)
- Plain text

**14. CompletedDate** (Date and time)
- Include time: Yes

**15. ConstructionGroup** (Text)
- Max length: 50
- Default value: "CG 01.12"

### Step 5: Create Views (5 min)

**New Requests View:**
1. Click **All Items** > **Create new view**
2. Name: `New Requests`
3. Filter: Where **Status** equals **NEW**
4. Sort: **Created** descending
5. Save

**My Requests View:**
1. Create new view: `My Requests`
2. Filter: Where **RequestorEmail** equals **[Me]**
3. Sort: **Created** descending
4. Save

**In Progress View:**
1. Create new view: `In Progress`
2. Filter: Where **Status** equals **IN_PROGRESS**
3. Sort: **Created** descending
4. Save

---

## Power Apps Form (Simple Version)

### Step 1: Create Power App (10 min)

1. Go to: https://make.powerapps.com
2. Click **+ Create** > **Blank app** > **Phone** layout
3. Name: "Crew Change Request Form"
4. Click **Create**

### Step 2: Connect to SharePoint (2 min)

1. Click **Data** (left panel)
2. Click **+ Add data**
3. Search: "SharePoint"
4. Enter site URL: `https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx`
5. Select: `LDC_CrewChangeRequests`
6. Click **Connect**

### Step 3: Add Form Controls (15 min)

Instead of using a standard form, we'll build a custom form with conditional logic.

**Add these controls to your screen:**

1. **Label** - Header: "Crew Change Request"
2. **Dropdown** - Request Type
3. **Text Input** - Volunteer Name
4. **Text Input** - Volunteer BA ID
5. **Dropdown** - Trade Team (if using lookups)
6. **Dropdown** - Crew (filtered by trade team)
7. **Dropdown** - Project (if using lookups)
8. **Text Input** - Custom Project Name
9. **Text Input (Multiline)** - Comments
10. **Button** - Submit

1. Click **Insert** > **Forms** > **Edit**
2. Set **DataSource**: `LDC_CrewChangeRequests`
3. Set **Item**: `Defaults(LDC_CrewChangeRequests)`
4. Click **Edit fields**
5. Remove fields you don't want users to fill:
   - Status (auto-set to NEW)
   - AssignedTo (admin only)
   - ResolutionNotes (admin only)
   - CompletedDate (admin only)
6. Reorder fields:
   - RequestType
   - VolunteerName
   - VolunteerBaId
   - TradeTeamName
   - CrewName
   - ProjectName
   - Comments
   - RequestorName (auto-fill with user name)
   - RequestorEmail (auto-fill with user email)

### Step 4: Configure Dropdowns with Filtering (20 min)

**1. Request Type Dropdown**
```powerfx
// Items property
["ADD_TO_CREW", "REMOVE_FROM_CREW", "ADD_TO_PROJECT_ROSTER", "ADD_TO_CREW_AND_PROJECT"]
```

**2. Trade Team Dropdown** (if using lookups)
```powerfx
// Items property
LDC_TradeTeams

// DisplayFields property
["Title"]

// Visible property (show only for crew-related requests)
Or(
    drpRequestType.Selected.Value = "ADD_TO_CREW",
    drpRequestType.Selected.Value = "REMOVE_FROM_CREW",
    drpRequestType.Selected.Value = "ADD_TO_CREW_AND_PROJECT"
)
```

**3. Crew Dropdown** (FILTERED by selected trade team)
```powerfx
// Items property - THIS IS THE KEY FILTERING LOGIC!
Filter(
    LDC_TradeCrews,
    TradeTeam.Title = drpTradeTeam.Selected.Title
)

// DisplayFields property
["Title"]

// Visible property (show only when trade team is selected)
And(
    !IsBlank(drpTradeTeam.Selected),
    Or(
        drpRequestType.Selected.Value = "ADD_TO_CREW",
        drpRequestType.Selected.Value = "REMOVE_FROM_CREW",
        drpRequestType.Selected.Value = "ADD_TO_CREW_AND_PROJECT"
    )
)
```

**4. Project Dropdown** (if using lookups)
```powerfx
// Items property
LDC_Projects

// DisplayFields property
["Title"]

// Visible property (show only for project-related requests)
Or(
    drpRequestType.Selected.Value = "ADD_TO_PROJECT_ROSTER",
    drpRequestType.Selected.Value = "ADD_TO_CREW_AND_PROJECT"
)
```

**5. Custom Project Name Input**
```powerfx
// Visible property
Or(
    drpRequestType.Selected.Value = "ADD_TO_PROJECT_ROSTER",
    drpRequestType.Selected.Value = "ADD_TO_CREW_AND_PROJECT"
)

// HintText property
"Or enter project name if not in dropdown"
```

### Step 5: Add Submit Button with Validation (10 min)

**Button OnSelect property:**
```powerfx
// Validate required fields
If(
    IsBlank(txtVolunteerName.Text),
    Notify("Please enter volunteer name", NotificationType.Error),
    IsBlank(drpRequestType.Selected),
    Notify("Please select request type", NotificationType.Error),
    
    // Validate crew fields for crew-related requests
    And(
        Or(
            drpRequestType.Selected.Value = "ADD_TO_CREW",
            drpRequestType.Selected.Value = "REMOVE_FROM_CREW",
            drpRequestType.Selected.Value = "ADD_TO_CREW_AND_PROJECT"
        ),
        Or(IsBlank(drpTradeTeam.Selected), IsBlank(drpCrew.Selected))
    ),
    Notify("Please select trade team and crew", NotificationType.Error),
    
    // All validations passed - submit the request
    Patch(
        LDC_CrewChangeRequests,
        Defaults(LDC_CrewChangeRequests),
        {
            Title: "Request by " & User().FullName,
            RequestType: drpRequestType.Selected.Value,
            RequestorName: User().FullName,
            RequestorEmail: User().Email,
            VolunteerName: txtVolunteerName.Text,
            VolunteerBaId: txtBaId.Text,
            TradeTeam: drpTradeTeam.Selected,  // Lookup value
            Crew: drpCrew.Selected,  // Lookup value
            Project: drpProject.Selected,  // Lookup value
            ProjectNameCustom: txtCustomProject.Text,
            Comments: txtComments.Text,
            Status: "NEW",
            ConstructionGroup: "CG 01.12"
        }
    );
    Notify("Request submitted successfully!", NotificationType.Success);
    
    // Reset form
    Reset(drpRequestType);
    Reset(drpTradeTeam);
    Reset(drpCrew);
    Reset(drpProject);
    Reset(txtVolunteerName);
    Reset(txtBaId);
    Reset(txtCustomProject);
    Reset(txtComments);
)
```

**Button DisplayMode property:**
```powerfx
If(
    IsBlank(txtVolunteerName.Text) || IsBlank(drpRequestType.Selected),
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### Step 6: Style the Form (10 min)

1. Add header label: "Crew Change Request"
2. Add instructions text
3. Set colors to match your branding
4. Test the form

---

## Testing Checklist

- [ ] List created in My Lists
- [ ] All 14 columns added correctly
- [ ] Views created (New Requests, My Requests, In Progress)
- [ ] Power App created and connected
- [ ] Form shows all required fields
- [ ] RequestorName auto-fills with your name
- [ ] RequestorEmail auto-fills with your email
- [ ] ConstructionGroup defaults to "CG 01.12"
- [ ] Submit button works
- [ ] Request appears in SharePoint list
- [ ] Status defaults to NEW
- [ ] Can view request in "My Requests" view

---

## Sample Test Data

Submit a test request:

- **Request Type:** ADD_TO_CREW
- **Volunteer Name:** John Smith
- **Volunteer BA ID:** 12345
- **Trade Team Name:** Drywall
- **Crew Name:** Drywall Crew 1
- **Comments:** Adding experienced volunteer to help with upcoming project

---

## Admin Workflow (In SharePoint)

1. Admin opens SharePoint list
2. Switches to "New Requests" view
3. Clicks on a request
4. Updates:
   - **Status** → IN_PROGRESS
   - **AssignedTo** → (themselves)
5. Processes the request (adds volunteer to crew in main system)
6. Updates:
   - **Status** → COMPLETED
   - **ResolutionNotes** → "Added to crew roster"
   - **CompletedDate** → (today)

---

## What This Proves

✅ **SharePoint lists work** for data storage  
✅ **Power Apps can connect** to SharePoint  
✅ **Forms can auto-fill** user information  
✅ **Workflow is simple** and intuitive  
✅ **No admin rights needed** - works in secure M365  
✅ **Data stays in tenant** - meets governance requirements  

---

## Next Steps After Success

Once this works, you can:

1. **Deploy to production** - Create list in actual site
2. **Share with team** - Let CG 01.12 members submit requests
3. **Gather feedback** - See what works, what doesn't
4. **Expand to Option 1** - Build full LDC Tools implementation

---

## Time Breakdown

- SharePoint list creation: 25 minutes
- Power Apps form creation: 30 minutes
- Testing and refinement: 15 minutes
- **Total: ~70 minutes** (well under the 5-10 hour estimate)

---

## Troubleshooting

**"Can't connect to My Lists"**
- Use the direct URL provided
- Or create in OneDrive > Lists

**"Form won't submit"**
- Check all required fields are filled
- Verify SharePoint connection is active
- Check for validation errors

**"Auto-fill not working"**
- Verify OnVisible code is correct
- Check User() function returns data
- Test with hardcoded values first

---

**Ready to build? Start with Step 1!** 🚀
