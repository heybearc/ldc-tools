# Build Crew Change Request Form with Copilot in Power Apps

**Time: 10-15 minutes** (vs 30-45 minutes manual)  
**Difficulty: Easy** - Just describe what you want in natural language

---

## What is Copilot in Power Apps?

Copilot is an AI assistant built into Power Apps that can:
- Generate entire apps from natural language descriptions
- Create forms connected to your SharePoint lists
- Add conditional logic and filtering
- Build UI layouts automatically

**Perfect for this use case!**

---

## Prerequisites

✅ You should have already created:
- `LDC_TradeTeams` list (with sample trade teams)
- `LDC_TradeCrews` list (with TradeTeam lookup)
- `LDC_Projects` list (with sample projects)
- `LDC_CrewChangeRequests` list (main list with all columns)

---

## Step-by-Step: Build with Copilot

### Step 1: Start with Copilot (2 min)

1. Go to: **https://make.powerapps.com**
2. Click **+ Create** (left sidebar)
3. Look for **"Describe the app you want to build"** or **"Start with Copilot"**
4. Click to start

**Alternative if you don't see Copilot:**
- Click **+ Create** > **Blank app** > **Canvas**
- Once in Power Apps Studio, look for the **Copilot** panel on the right
- If not visible, click the **Copilot** icon in the toolbar

---

### Step 2: Give Copilot Your First Prompt (5 min)

**Copy and paste this prompt:**

```
Create a crew change request form connected to my SharePoint list "LDC_CrewChangeRequests" in My Lists.

The form should:
1. Auto-fill the requestor's name and email from the current user
2. Have a dropdown for request type with these options: ADD_TO_CREW, REMOVE_FROM_CREW, ADD_TO_PROJECT_ROSTER, ADD_TO_CREW_AND_PROJECT
3. Have text inputs for volunteer name and BA ID
4. Have a dropdown for trade teams from the LDC_TradeTeams list
5. Have a dropdown for crews from the LDC_TradeCrews list that filters based on the selected trade team
6. Have a dropdown for projects from the LDC_Projects list
7. Have a text input for custom project name
8. Have a multiline text input for comments
9. Show/hide the trade team and crew dropdowns only when the request type is ADD_TO_CREW, REMOVE_FROM_CREW, or ADD_TO_CREW_AND_PROJECT
10. Show/hide the project dropdown and custom project name only when the request type is ADD_TO_PROJECT_ROSTER or ADD_TO_CREW_AND_PROJECT
11. Have a submit button that saves the request with Status set to "NEW" and ConstructionGroup set to "CG 01.12"
12. Show a success message after submission and reset the form

Use a clean, modern design with proper spacing and labels.
```

---

### Step 3: Connect to SharePoint (2 min)

Copilot will likely ask you to connect to SharePoint. When prompted:

1. Click **Add data source** or **Connect to SharePoint**
2. Enter your site URL: `https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx`
3. Select these lists:
   - ✅ LDC_CrewChangeRequests
   - ✅ LDC_TradeTeams
   - ✅ LDC_TradeCrews
   - ✅ LDC_Projects
4. Click **Connect**

---

### Step 4: Refine with Follow-up Prompts (5 min)

After Copilot generates the initial app, you can refine it with these prompts:

**If the crew dropdown isn't filtering correctly:**
```
Make sure the crew dropdown only shows crews where the TradeTeam lookup matches the selected trade team from the trade team dropdown.
```

**If fields aren't hiding/showing correctly:**
```
The trade team and crew fields should only be visible when the request type is ADD_TO_CREW, REMOVE_FROM_CREW, or ADD_TO_CREW_AND_PROJECT. The project fields should only be visible when the request type is ADD_TO_PROJECT_ROSTER or ADD_TO_CREW_AND_PROJECT.
```

**If the submit button isn't working:**
```
When the submit button is clicked, create a new item in LDC_CrewChangeRequests with:
- Title: "Request by " + current user's full name
- RequestType: selected request type
- RequestorName: current user's full name
- RequestorEmail: current user's email
- VolunteerName: volunteer name input
- VolunteerBaId: BA ID input
- TradeTeam: selected trade team (lookup)
- Crew: selected crew (lookup)
- Project: selected project (lookup)
- ProjectNameCustom: custom project name input
- Comments: comments input
- Status: "NEW"
- ConstructionGroup: "CG 01.12"

Then show a success notification and reset all form fields.
```

**If you want better styling:**
```
Make the form look more professional with:
- A header with the title "LDC Crew Change Request"
- Grouped sections with light background colors
- Clear labels for all fields
- A large, prominent submit button at the bottom
- Use blue as the primary color
```

---

### Step 5: Test the Form (3 min)

1. Click **Play** (▶️) button in top right
2. Test each request type:
   - Select "ADD_TO_CREW" - verify trade team/crew fields appear
   - Select "ADD_TO_PROJECT_ROSTER" - verify project fields appear
   - Select a trade team - verify crew dropdown filters correctly
3. Fill out the form completely
4. Click **Submit**
5. Check SharePoint list to verify the request was created

---

## Troubleshooting Copilot

### "I can't find your SharePoint list"
**Solution:** Make sure you're using the full My Lists URL:
```
https://jwsite.sharepoint.com/_layouts/15/MyLists.aspx
```

### "The crew dropdown isn't filtering"
**Prompt to fix:**
```
The crew dropdown should use this formula for its Items property:
Filter(LDC_TradeCrews, TradeTeam.Title = drpTradeTeam.Selected.Title)

Make sure the trade team dropdown is named drpTradeTeam.
```

### "Fields aren't showing/hiding"
**Prompt to fix:**
```
Set the Visible property of the trade team dropdown to:
Or(drpRequestType.Selected.Value = "ADD_TO_CREW", drpRequestType.Selected.Value = "REMOVE_FROM_CREW", drpRequestType.Selected.Value = "ADD_TO_CREW_AND_PROJECT")

Set the Visible property of the project dropdown to:
Or(drpRequestType.Selected.Value = "ADD_TO_PROJECT_ROSTER", drpRequestType.Selected.Value = "ADD_TO_CREW_AND_PROJECT")
```

### "Copilot isn't available"
**Possible reasons:**
1. Your M365 license doesn't include Copilot for Power Apps
2. Your tenant admin hasn't enabled it
3. You're in a GCC or government tenant (Copilot may not be available)

**Fallback:** Use the manual build guide in `OPTION-3-QUICK-START.md`

---

## Advanced Copilot Prompts

Once the basic form works, you can enhance it:

**Add validation:**
```
Add validation to ensure:
- Volunteer name is required
- Request type is required
- If request type involves crews, trade team and crew must be selected
- Show error messages if validation fails
```

**Add a confirmation dialog:**
```
Before submitting, show a confirmation dialog that displays:
- Volunteer name
- Request type
- Selected crew (if applicable)
- Selected project (if applicable)
Ask the user to confirm before submitting.
```

**Add a success screen:**
```
After successful submission, navigate to a success screen that shows:
- A checkmark icon
- "Request Submitted Successfully" message
- Details of what was submitted
- A button to submit another request
```

**Add batch submission:**
```
Allow users to add multiple volunteers to the same request by:
- Adding a "+" button to add more volunteer name/BA ID pairs
- Submitting separate requests for each volunteer with the same crew/project
- Grouping them with a batch ID
```

---

## What Copilot Can vs Cannot Do

### ✅ Copilot CAN:
- Generate entire app layouts from descriptions
- Connect to SharePoint lists
- Create dropdowns with filtering logic
- Add conditional visibility
- Create submit buttons with Patch() formulas
- Style the UI with colors and spacing
- Add validation and error handling

### ❌ Copilot CANNOT:
- Create SharePoint lists (you must create these first)
- Modify SharePoint list schemas
- Deploy the app to production (you still need to publish)
- Grant permissions to other users (you do this manually)

---

## After Copilot Builds Your App

### Step 1: Save the App
1. Click **File** > **Save**
2. Name: "LDC Crew Change Request Form"
3. Click **Save**

### Step 2: Publish the App
1. Click **File** > **Publish**
2. Click **Publish this version**
3. Wait for confirmation

### Step 3: Share the App (Optional)
1. Click **File** > **Share**
2. Add users or groups who should access the form
3. Set permissions (Can use, Can edit)
4. Click **Share**

### Step 4: Get the App Link
1. Go back to https://make.powerapps.com
2. Click **Apps** (left sidebar)
3. Find "LDC Crew Change Request Form"
4. Click **...** (three dots) > **Details**
5. Copy the **Web link**
6. Share this link with your team

---

## Comparison: Copilot vs Manual

| Task | Manual Build | Copilot Build |
|------|-------------|---------------|
| **Time** | 30-45 min | 10-15 min |
| **Difficulty** | Medium | Easy |
| **Power Fx knowledge** | Required | Not required |
| **Customization** | Full control | Iterative refinement |
| **Learning curve** | Steep | Gentle |
| **Result quality** | Depends on skill | Consistently good |

**Recommendation:** Start with Copilot, refine manually if needed.

---

## Full Example Conversation with Copilot

**You:** Create a crew change request form connected to my SharePoint list "LDC_CrewChangeRequests" in My Lists. [full prompt from Step 2]

**Copilot:** I'll create that form for you. First, let me connect to your SharePoint lists. [connects to data]

**Copilot:** I've created a form with the fields you requested. The trade team and crew dropdowns are set up with filtering logic.

**You:** The crew dropdown isn't filtering correctly. Make sure it only shows crews where the TradeTeam lookup matches the selected trade team.

**Copilot:** I've updated the crew dropdown to filter based on the selected trade team. The Items property now uses: Filter(LDC_TradeCrews, TradeTeam.Title = drpTradeTeam.Selected.Title)

**You:** Perfect! Now make the form look more professional with a header and better colors.

**Copilot:** I've updated the design with a blue header, grouped sections, and improved spacing. How does it look?

**You:** Great! Test it by submitting a request.

---

## Tips for Working with Copilot

1. **Be specific** - The more detail you provide, the better the result
2. **Iterate** - Start simple, then refine with follow-up prompts
3. **Test frequently** - Click Play and test after each change
4. **Use examples** - Show Copilot what you want with examples
5. **Reference controls by name** - If Copilot names a dropdown "drpTradeTeam", use that name in follow-up prompts
6. **Check the formulas** - Copilot generates Power Fx - you can view and edit them
7. **Save often** - Don't lose your work!

---

## Next Steps After Building

1. **Test thoroughly** - Try all request types and edge cases
2. **Get feedback** - Share with 2-3 pilot users
3. **Refine** - Use their feedback to improve
4. **Document** - Create a user guide for your team
5. **Deploy** - Share with all CG 01.12 members
6. **Monitor** - Check the SharePoint list regularly for new requests

---

## If Copilot Isn't Available

If your tenant doesn't have Copilot enabled, you have two options:

**Option 1: SharePoint Auto-Generate (5 min)**
1. Go to `LDC_CrewChangeRequests` list
2. Click **Integrate** > **Power Apps** > **Create an app**
3. SharePoint generates a basic form
4. Manually add the filtering logic from the manual guide

**Option 2: Manual Build (30-45 min)**
- Follow the detailed guide in `OPTION-3-QUICK-START.md`
- Copy/paste the Power Fx formulas
- More time-consuming but gives you full control

---

**Ready to build? Start with Step 1 and let Copilot do the heavy lifting!** 🚀
