# LDC Tools v2 - Excel VBA Edition

**A self-contained, offline construction management tool built entirely in Excel with VBA**

## Overview

LDC Tools v2 is a complete rewrite of the LDC Tools web application as a standalone Excel workbook (.xlsm). It provides a web-app-like experience with navigation, views, and data management - all without requiring internet connectivity or external dependencies.

## Features

- **Dashboard**: KPI cards, recent projects, task overview
- **Projects Management**: Full CRUD operations with filtering and search
- **Task Management**: Assign, track, and complete tasks
- **People Management**: Manage team members and roles
- **Reports**: Charts and pivot-based summaries
- **Admin/Settings**: Configure statuses, risk levels, and categories

## System Requirements

- **Windows**: Microsoft Excel 2016 or later (Microsoft 365 recommended)
- **Mac**: Excel for Mac 2016 or later (some limitations apply - see below)
- **Macros**: Must enable macros when opening the workbook

## Installation

1. Download `LDC-Tools-v2.xlsm`
2. Open the file in Excel
3. Click "Enable Content" when prompted to allow macros
4. The Dashboard will load automatically

## How to Use

### Navigation

The left sidebar provides access to all main views:
- **Dashboard**: Overview of projects and tasks
- **Projects**: View and manage all projects
- **Tasks**: View and manage all tasks
- **People**: Manage team members
- **Reports**: View analytics and charts
- **Admin/Settings**: Configure application settings

### Creating a New Project

1. Navigate to **Projects** or click **New Project** on the Dashboard
2. Click the **New Project** button
3. Fill in the project details (Name, Owner, Start Date, Due Date, etc.)
4. Click **Save**

### Creating a New Task

1. Navigate to **Tasks** or open a Project Detail view
2. Click **New Task** or **Add Task**
3. Fill in task details (Title, Assignee, Priority, Due Date, etc.)
4. Click **Save**

### Filtering and Search

- Use the filter dropdowns to narrow down projects or tasks by status, owner, date range
- Use the search box to find specific items by name or title
- Filters persist until cleared

### Completing Tasks

1. Navigate to the **Tasks** view
2. Find the task you want to complete
3. Click the **Complete** button or change status to "Completed"
4. The completion date is automatically recorded

## Data Model

The workbook uses structured Excel Tables on hidden sheets:

### tblProjects
- ProjectID (unique identifier)
- Name
- Status (Active, On Hold, Completed, Cancelled)
- OwnerID (references tblPeople)
- StartDate
- DueDate
- RiskLevel (Low, Medium, High, Critical)
- PercentComplete (0-100)
- Notes
- CreatedAt
- UpdatedAt

### tblTasks
- TaskID (unique identifier)
- ProjectID (references tblProjects)
- Title
- Status (Not Started, In Progress, Completed, Blocked)
- AssigneeID (references tblPeople)
- Priority (Low, Medium, High, Critical)
- StartDate
- DueDate
- CompletedDate
- Notes
- CreatedAt
- UpdatedAt

### tblPeople
- PersonID (unique identifier)
- DisplayName
- Email
- Role (PM, Contributor, Admin)
- Active (TRUE/FALSE)

### tblSettings
- Key (setting name)
- Value (setting value)

### tblLookups
- Type (Status, Risk, Priority, etc.)
- Code (internal code)
- Label (display label)
- SortOrder
- Active (TRUE/FALSE)

## Architecture

The VBA codebase follows an MVC-inspired architecture:

### Modules

- **modApp**: Application bootstrap, routing, global state
- **modNav**: Navigation logic and view switching
- **modData**: CRUD operations for all tables
- **modUI**: UI rendering (cards, lists, forms)
- **modValidation**: Field validation rules
- **modUtils**: Utility functions (date formatting, ID generation, etc.)

### Classes

- **clsProject**: Project entity with properties and methods
- **clsTask**: Task entity with properties and methods
- **clsPerson**: Person entity with properties and methods

### Key Functions

- `Navigate(viewName, Optional args)`: Main routing function
- `RenderDashboard()`: Renders the dashboard view
- `RenderProjectsList()`: Renders the projects list view
- `RenderProjectDetail(projectID)`: Renders project detail view
- `CreateProject()`: Creates a new project
- `UpdateProject(projectID)`: Updates an existing project
- `DeleteProject(projectID)`: Deletes a project (soft delete)

## Adding New Views

To add a new view to the application:

1. **Create the sheet** (if using multi-sheet approach) or define a region (if using single-sheet)
2. **Add navigation button** in `modNav.InitializeNavigation()`
3. **Create render function** in `modUI` (e.g., `RenderMyNewView()`)
4. **Add route** in `modApp.Navigate()` to handle the new view
5. **Create any needed CRUD functions** in `modData`

Example:
```vba
' In modUI
Public Sub RenderMyNewView()
    Application.ScreenUpdating = False
    ClearContentArea
    ' Your rendering logic here
    Application.ScreenUpdating = True
End Sub

' In modApp
Public Sub Navigate(viewName As String, Optional args As Variant)
    Select Case viewName
        Case "MyNewView"
            modUI.RenderMyNewView
        ' ... other cases
    End Select
End Sub
```

## Migrating from Web Version

If you're migrating data from the web-based LDC Tools:

1. **Export data** from the web app (use the export feature or database export)
2. **Prepare CSV files** with the following structure:
   - `projects.csv`: ProjectID, Name, Status, Owner, StartDate, DueDate, RiskLevel, PercentComplete, Notes
   - `tasks.csv`: TaskID, ProjectID, Title, Status, Assignee, Priority, StartDate, DueDate, Notes
   - `people.csv`: PersonID, DisplayName, Email, Role
3. **Import to Excel**:
   - Open LDC-Tools-v2.xlsm
   - Navigate to Admin/Settings
   - Click **Import Data**
   - Select your CSV files
   - Map columns if needed
   - Click **Import**

### Manual Migration Steps

1. Unhide the data sheets (Data_Projects, Data_Tasks, Data_People)
2. Copy your data into the appropriate tables
3. Ensure IDs are unique and references are valid
4. Re-hide the data sheets
5. Refresh the Dashboard

## Known Limitations

### Excel for Mac
- **ActiveX controls not supported**: We use Form Controls and Shapes instead
- **Some VBA functions differ**: Date handling may vary slightly
- **Performance**: May be slower on Mac for large datasets (500+ projects)

### General Limitations
- **Concurrent users**: Not designed for multi-user editing (use Excel Online or SharePoint if needed)
- **Data volume**: Optimal performance with <1000 projects and <5000 tasks
- **Charts**: Limited to Excel's built-in chart types
- **Export**: PDF export requires Excel's built-in PDF functionality

## Troubleshooting

### Macros are disabled
- Go to File > Options > Trust Center > Trust Center Settings > Macro Settings
- Select "Enable all macros" or "Disable all macros with notification"
- Restart Excel and reopen the workbook

### Navigation buttons don't work
- Ensure macros are enabled
- Check that the workbook is not in Protected View (File > Info > Enable Editing)

### Data not showing
- Unhide the data sheets to verify data exists
- Check that table names match (tblProjects, tblTasks, tblPeople)
- Verify no filters are applied to the tables

### Performance issues
- Reduce the number of visible rows (use filters)
- Archive old projects to a separate workbook
- Disable animations in Excel settings

## Development

### Exporting VBA Code

To export VBA modules for version control:

1. Open the VBA Editor (Alt+F11)
2. Right-click each module/class
3. Select "Export File"
4. Save to `excel-vba/vba-modules/` directory

### Importing VBA Code

To import VBA modules into a new workbook:

1. Open the VBA Editor (Alt+F11)
2. File > Import File
3. Select the .bas or .cls file from `excel-vba/vba-modules/`
4. Repeat for all modules

### Version Control

VBA code is stored as separate files in the `vba-modules/` directory:
- `modApp.bas`
- `modNav.bas`
- `modData.bas`
- `modUI.bas`
- `modValidation.bas`
- `modUtils.bas`
- `clsProject.cls`
- `clsTask.cls`
- `clsPerson.cls`

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the VBA code comments for implementation details
- Consult Excel VBA documentation for platform-specific issues

## License

Internal use only. Not for redistribution.

## Version History

### v2.0.0 (Initial Release)
- Complete rewrite as Excel VBA application
- Dashboard with KPI cards
- Projects, Tasks, and People management
- Reports and Admin views
- Offline, self-contained operation
