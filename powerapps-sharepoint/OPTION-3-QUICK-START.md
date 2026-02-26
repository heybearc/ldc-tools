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

### LDC_CrewChangeRequests

| Column Name | Type | Settings | Description |
|-------------|------|----------|-------------|
| Title | Text | Required | Auto-set to "Request by [Name]" |
| RequestType | Choice | Required | ADD_TO_CREW, REMOVE_FROM_CREW, ADD_TO_PROJECT_ROSTER, ADD_TO_CREW_AND_PROJECT |
| RequestorName | Text | Required, Max: 255 | Name of person making request |
| RequestorEmail | Text | Required, Max: 255 | Email of requestor |
| VolunteerName | Text | Required, Max: 255 | Name of volunteer being added/removed |
| VolunteerBaId | Text | Max: 50 | Builder Assistant ID |
| TradeTeamName | Text | Max: 255 | Trade team name (e.g., "Drywall") |
| CrewName | Text | Max: 255 | Crew name |
| ProjectName | Text | Max: 255 | Project name if adding to roster |
| Comments | Multiple lines | Plain text | Additional notes/context |
| Status | Choice | Required, Default: NEW | NEW, IN_PROGRESS, COMPLETED, REJECTED |
| AssignedTo | Person | Single | Person assigned to process request |
| ResolutionNotes | Multiple lines | Plain text | Admin notes on resolution |
| CompletedDate | Date/Time | Include time | When request was completed |
| ConstructionGroup | Text | Default: "CG 01.12" | Your construction group |

**Total:** 15 columns (including built-in Title, Created, Modified)

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

### Step 3: Add Columns (15 min)

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

**6. TradeTeamName** (Text)
- Max length: 255

**7. CrewName** (Text)
- Max length: 255

**8. ProjectName** (Text)
- Max length: 255

**9. Comments** (Multiple lines of text)
- Plain text

**10. Status** (Choice)
- Choices: NEW, IN_PROGRESS, COMPLETED, REJECTED
- Required: Yes
- Default: NEW

**11. AssignedTo** (Person)
- Single selection

**12. ResolutionNotes** (Multiple lines of text)
- Plain text

**13. CompletedDate** (Date and time)
- Include time: Yes

**14. ConstructionGroup** (Text)
- Max length: 50
- Default value: "CG 01.12"

### Step 4: Create Views (5 min)

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

### Step 3: Add Form (5 min)

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

### Step 4: Auto-Fill User Info (10 min)

1. Click the form
2. Set **OnVisible** property:
```powerfx
Set(varCurrentUser, User());
```

3. Click **RequestorName** data card
4. Set **Default** property:
```powerfx
varCurrentUser.FullName
```

5. Click **RequestorEmail** data card
6. Set **Default** property:
```powerfx
varCurrentUser.Email
```

7. Click **ConstructionGroup** data card
8. Set **Default** property:
```powerfx
"CG 01.12"
```

### Step 5: Add Submit Button (5 min)

1. **Insert** > **Button**
2. Text: "Submit Request"
3. OnSelect:
```powerfx
SubmitForm(Form1);
If(Form1.LastSubmit.Error = Blank(),
    Notify("Request submitted successfully!", NotificationType.Success);
    ResetForm(Form1),
    Notify("Error: " & Form1.LastSubmit.Error, NotificationType.Error)
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
