# LDC Tools v2 - Implementation Guide

## Overview

This guide provides step-by-step instructions for building the LDC Tools v2 Excel workbook from the VBA modules provided in this repository.

## Prerequisites

- Microsoft Excel 2016 or later (Windows or Mac)
- Macro-enabled workbook support
- Basic understanding of VBA and Excel

## Implementation Steps

### Step 1: Create New Workbook

1. Open Excel
2. Create a new blank workbook
3. Save as `LDC-Tools-v2.xlsm` (Excel Macro-Enabled Workbook)

### Step 2: Enable Developer Tab

**Windows:**
1. File > Options > Customize Ribbon
2. Check "Developer" in the right column
3. Click OK

**Mac:**
1. Excel > Preferences > Ribbon & Toolbar
2. Check "Developer" tab
3. Click Save

### Step 3: Import VBA Modules

1. Press `Alt+F11` (Windows) or `Option+F11` (Mac) to open VBA Editor
2. For each `.bas` file in `excel-vba/vba-modules/`:
   - File > Import File
   - Select the module file
   - Click Open
   
**Import these modules in order:**
- `modUtils.bas`
- `modValidation.bas`
- `modData.bas`
- `modNav.bas`
- `modUI.bas`
- `modApp.bas`

3. Import the class module:
   - File > Import File
   - Select `ThisWorkbook.cls`
   - **Note:** This will replace the existing ThisWorkbook module

### Step 4: Configure Workbook Structure

The VBA code will automatically create the necessary sheets when the workbook opens, but you can manually prepare them:

**Create these sheets (or let the code create them automatically):**
- `UI_Main` - Main user interface (visible)
- `Data_Projects` - Projects data table (hidden)
- `Data_Tasks` - Tasks data table (hidden)
- `Data_People` - People data table (hidden)
- `Data_Settings` - Settings data table (hidden)
- `Data_Lookups` - Lookup values table (hidden)

### Step 5: Set Macro Security

**Windows:**
1. File > Options > Trust Center > Trust Center Settings
2. Macro Settings > "Enable all macros" (for development)
3. Click OK

**Mac:**
1. Excel > Preferences > Security & Privacy
2. Select "Enable all macros"
3. Click OK

**Important:** For production use, sign the VBA project with a digital certificate and use "Disable all macros except digitally signed macros"

### Step 6: Initial Test Run

1. Close the VBA Editor
2. Save the workbook
3. Close and reopen the workbook
4. Click "Enable Content" when prompted
5. The application should initialize and display the Dashboard

**Expected behavior:**
- Dashboard view loads automatically
- Navigation panel appears on the left
- Header bar appears at the top
- Sample data is created (1 project, 3 tasks, 3 people)

### Step 7: Verify Data Tables

1. Press `Alt+F11` to open VBA Editor
2. View > Immediate Window
3. Type: `?modData.GetTable("tblProjects").ListRows.Count`
4. Press Enter
5. Should return `1` (one sample project)

### Step 8: Configure Sheet Protection (Optional)

To prevent accidental edits to the UI:

1. Right-click `UI_Main` sheet tab
2. Protect Sheet
3. Uncheck "Select locked cells" and "Select unlocked cells"
4. Set a password (optional)
5. Click OK

**To hide data sheets:**
1. Right-click each `Data_*` sheet tab
2. Hide > Very Hidden (requires VBA to unhide)

### Step 9: Customize Appearance

**Adjust colors:**
- Edit color constants in `modNav.bas` and `modUI.bas`
- Search for `RGB(` to find all color definitions

**Adjust layout:**
- Edit layout constants in `modUI.bas`:
  - `CONTENT_LEFT`, `CONTENT_TOP`, `CONTENT_WIDTH`
  - `CARD_HEIGHT`, `CARD_SPACING`

**Adjust fonts:**
- Search for `.TextFrame2.TextRange.Font.Size` in `modUI.bas`
- Modify font sizes as needed

### Step 10: Add Custom Branding (Optional)

1. Insert company logo as image on `UI_Main` sheet
2. Position in header area (top-right recommended)
3. Right-click image > Format Picture > Properties
4. Check "Don't move or size with cells"

## Testing Checklist

After implementation, verify these features:

### Navigation
- [ ] Dashboard button navigates to Dashboard
- [ ] Projects button navigates to Projects list
- [ ] Tasks button navigates to Tasks list
- [ ] People button navigates to People list
- [ ] Reports button navigates to Reports
- [ ] Admin button navigates to Admin/Settings

### Dashboard
- [ ] KPI cards display correct counts
- [ ] Recent projects list shows sample project
- [ ] New Project button displays message
- [ ] New Task button displays message

### Projects List
- [ ] Sample project appears in list
- [ ] Project details are correct
- [ ] Clicking project row navigates to Project Detail
- [ ] New Project button displays message

### Project Detail
- [ ] Back button returns to Projects list
- [ ] Project details card shows all fields
- [ ] Tasks section shows project tasks
- [ ] Add Task button displays message

### Tasks List
- [ ] Sample tasks appear in list
- [ ] Task details are correct
- [ ] New Task button displays message

### Data Integrity
- [ ] Data persists after closing and reopening
- [ ] No errors in Immediate Window
- [ ] All tables have correct structure

## Troubleshooting

### "Compile error: Sub or Function not defined"
- Ensure all modules are imported
- Check module names match exactly
- Verify no typos in function calls

### "Run-time error '9': Subscript out of range"
- Ensure sheet names match exactly
- Check that data sheets exist
- Verify table names are correct

### Navigation buttons don't work
- Ensure macros are enabled
- Check button OnAction properties
- Verify modApp.Navigate function exists

### Data doesn't persist
- Ensure workbook is saved as .xlsm (macro-enabled)
- Check that tables are properly created
- Verify data sheets are not deleted

### Shapes/buttons don't appear
- Check screen updating is enabled
- Verify UI_Main sheet exists
- Run modApp.InitializeApp manually from Immediate Window

## Performance Optimization

For large datasets (500+ projects):

1. **Disable screen updating during renders:**
   - Already implemented in modUI functions
   
2. **Limit visible rows:**
   - Modify loop limits in `RenderProjectsTable` and similar functions
   
3. **Add pagination:**
   - Implement page navigation in future version
   
4. **Use filters:**
   - Implement filter dropdowns to reduce visible data

## Next Steps

After successful implementation:

1. **Add UserForms for data entry:**
   - Create `frmNewProject` for project creation
   - Create `frmNewTask` for task creation
   - Create `frmEditProject` for project editing
   
2. **Implement search functionality:**
   - Add search box to header
   - Filter tables based on search term
   
3. **Add export functionality:**
   - Export to CSV
   - Export to PDF (if available)
   
4. **Implement Reports view:**
   - Add charts for project status
   - Add pivot tables for analytics
   
5. **Implement Admin view:**
   - Manage lookup values
   - Configure settings
   - Import/export data

## Support

For issues or questions:
- Review VBA code comments
- Check Excel VBA documentation
- Verify all prerequisites are met
- Test with sample data first

## Version Control

When making changes:

1. Export modified modules:
   - Right-click module in VBA Editor
   - Export File
   - Save to `excel-vba/vba-modules/`
   
2. Commit changes to Git:
   ```bash
   git add excel-vba/vba-modules/
   git commit -m "Description of changes"
   ```

3. Update version number in `modApp.APP_VERSION`

## License

Internal use only. Not for redistribution.
