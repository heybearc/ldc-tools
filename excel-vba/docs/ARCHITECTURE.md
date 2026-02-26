# LDC Tools v2 - Architecture Documentation

## System Architecture

LDC Tools v2 follows an MVC-inspired architecture adapted for Excel VBA, with clear separation between data, business logic, and presentation layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│                         (UI_Main Sheet)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Navigation  │  │    Header    │  │   Content    │      │
│  │    Panel     │  │     Bar      │  │     Area     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│                          (modUI.bas)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RenderDashboard, RenderProjectsList,               │  │
│  │  RenderProjectDetail, RenderTasksList, etc.         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                   (modApp.bas, modNav.bas)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routing, Navigation, State Management               │  │
│  │  Navigate(), InitializeApp(), GetCurrentView()       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Business Logic                         │
│              (modValidation.bas, modUtils.bas)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Validation Rules, Utility Functions                 │  │
│  │  ValidateProjectData(), FormatDate(), GenerateID()   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Data Layer                           │
│                        (modData.bas)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CRUD Operations for all entities                    │  │
│  │  CreateProject(), GetAllTasks(), UpdatePerson()      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                      │
│                    (Excel Tables/ListObjects)                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │tblProjects │  │  tblTasks  │  │ tblPeople  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐                            │
│  │tblSettings │  │ tblLookups │                            │
│  └────────────┘  └────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### modApp.bas - Application Bootstrap & Routing
**Purpose:** Central application controller

**Key Functions:**
- `InitializeApp()` - Bootstrap the application on workbook open
- `Navigate(viewName, args)` - Route to different views
- `GetCurrentView()` - Get active view name
- `RefreshCurrentView()` - Reload current view

**Global State:**
- `g_CurrentView` - Currently active view
- `g_CurrentProjectID` - Selected project ID (for detail view)
- `g_CurrentFilter` - Active filter settings
- `g_IsInitialized` - Application initialization status

### modNav.bas - Navigation Management
**Purpose:** Handle navigation panel and view switching

**Key Functions:**
- `InitializeNavigation()` - Create navigation panel and header
- `HighlightActiveView(viewName)` - Update active button styling
- `CreateNavigationPanel()` - Build left sidebar navigation
- `CreateHeaderBar()` - Build top header bar

**UI Elements Created:**
- Navigation buttons (Dashboard, Projects, Tasks, People, Reports, Admin)
- Header bar with app title
- Visual feedback for active view

### modUI.bas - UI Rendering
**Purpose:** Render all views and UI components

**Key Functions:**
- `RenderDashboard()` - Dashboard with KPIs and recent items
- `RenderProjectsList()` - Projects list view
- `RenderProjectDetail(projectID)` - Single project detail view
- `RenderTasksList()` - Tasks list view
- `RenderPeopleList()` - People management view
- `RenderReports()` - Reports and analytics view
- `RenderAdmin()` - Admin/settings view

**Helper Functions:**
- `RenderKPICard()` - KPI metric cards
- `RenderProjectsTable()` - Projects data table
- `RenderTaskListItem()` - Individual task row
- `ClearContentArea()` - Clear view before rendering

### modData.bas - Data Access Layer
**Purpose:** All CRUD operations for data entities

**Projects:**
- `CreateProject()` - Create new project
- `UpdateProject()` - Update existing project
- `DeleteProject()` - Delete project
- `GetProject(projectID)` - Get single project
- `GetAllProjects(filters)` - Get all projects with optional filters

**Tasks:**
- `CreateTask()` - Create new task
- `UpdateTask()` - Update existing task
- `CompleteTask()` - Mark task as completed
- `GetTasksByProject(projectID)` - Get tasks for a project
- `GetAllTasks(filters)` - Get all tasks with optional filters

**People:**
- `CreatePerson()` - Create new person
- `GetAllPeople(activeOnly)` - Get all people

**Lookups:**
- `GetLookupValues(type)` - Get lookup values by type

**Initialization:**
- `InitializeDataTables()` - Create all data tables
- `SeedInitialData()` - Populate with sample data

### modValidation.bas - Validation Rules
**Purpose:** Data validation and business rules

**Key Functions:**
- `ValidateProjectData()` - Validate project fields
- `ValidateTaskData()` - Validate task fields
- `ValidatePersonData()` - Validate person fields
- `IsValidDate()` - Date validation
- `IsValidEmail()` - Email format validation
- `IsValidPercentage()` - Percentage range validation

### modUtils.bas - Utility Functions
**Purpose:** Reusable helper functions

**Categories:**
- **ID Generation:** `GenerateID()`, `GenerateGUID()`
- **Date Formatting:** `FormatDateShort()`, `FormatDateLong()`, `IsOverdue()`
- **String Utilities:** `TruncateString()`, `CleanString()`, `IsNullOrEmpty()`
- **Number Utilities:** `SafeDivide()`, `PercentageToDecimal()`
- **Color Utilities:** `GetStatusColor()`, `GetRiskColor()`
- **Excel Utilities:** `DisableScreenUpdating()`, `SheetExists()`, `TableExists()`

### ThisWorkbook.cls - Workbook Events
**Purpose:** Handle workbook-level events

**Events:**
- `Workbook_Open()` - Initialize app on open
- `Workbook_BeforeClose()` - Cleanup before close
- `Workbook_SheetActivate()` - Prevent access to hidden sheets

## Data Model

### tblProjects
| Column | Type | Description |
|--------|------|-------------|
| ProjectID | String | Unique identifier (PRJ-YYYYMMDDHHNNSS-XXXX) |
| Name | String | Project name (max 255 chars) |
| Status | String | Active, On Hold, Completed, Cancelled |
| OwnerID | String | Reference to tblPeople.PersonID |
| StartDate | Date | Project start date |
| DueDate | Date | Project due date |
| RiskLevel | String | Low, Medium, High, Critical |
| PercentComplete | Long | 0-100 |
| Notes | String | Project notes/description |
| CreatedAt | Date | Record creation timestamp |
| UpdatedAt | Date | Last update timestamp |

### tblTasks
| Column | Type | Description |
|--------|------|-------------|
| TaskID | String | Unique identifier (TSK-YYYYMMDDHHNNSS-XXXX) |
| ProjectID | String | Reference to tblProjects.ProjectID |
| Title | String | Task title (max 255 chars) |
| Status | String | Not Started, In Progress, Completed, Blocked |
| AssigneeID | String | Reference to tblPeople.PersonID |
| Priority | String | Low, Medium, High, Critical |
| StartDate | Date | Task start date (optional) |
| DueDate | Date | Task due date (optional) |
| CompletedDate | Date | Completion timestamp (auto-set) |
| Notes | String | Task notes |
| CreatedAt | Date | Record creation timestamp |
| UpdatedAt | Date | Last update timestamp |

### tblPeople
| Column | Type | Description |
|--------|------|-------------|
| PersonID | String | Unique identifier (PER-YYYYMMDDHHNNSS-XXXX) |
| DisplayName | String | Full name |
| Email | String | Email address |
| Role | String | PM, Contributor, Admin |
| Active | Boolean | Active status |

### tblSettings
| Column | Type | Description |
|--------|------|-------------|
| Key | String | Setting name |
| Value | String | Setting value |

### tblLookups
| Column | Type | Description |
|--------|------|-------------|
| Type | String | Lookup type (ProjectStatus, RiskLevel, etc.) |
| Code | String | Internal code |
| Label | String | Display label |
| SortOrder | Long | Display order |
| Active | Boolean | Active status |

## View Flow

```
Workbook_Open
    ↓
InitializeApp
    ↓
InitializeDataTables (create tables if needed)
    ↓
InitializeNavigation (create UI shell)
    ↓
Navigate("Dashboard")
    ↓
RenderDashboard
```

### User Navigation Flow

```
Dashboard → Projects List → Project Detail → Back to Projects
    ↓           ↓               ↓
New Project  New Project    Add Task
    ↓           ↓               ↓
(Form)      (Form)          (Form)
    ↓           ↓               ↓
Refresh     Refresh         Refresh Project Detail
```

## Design Patterns

### 1. Single Responsibility Principle
Each module has one clear purpose:
- modApp: Routing only
- modNav: Navigation UI only
- modUI: View rendering only
- modData: Data access only
- modValidation: Validation only
- modUtils: Utilities only

### 2. Separation of Concerns
- **Data Layer** (modData) never touches UI
- **UI Layer** (modUI) never directly accesses tables
- **Validation Layer** (modValidation) is independent

### 3. Named Ranges and Constants
- No hard-coded cell addresses in business logic
- All UI positions use constants (CONTENT_LEFT, CONTENT_TOP, etc.)
- All colors use constants (COLOR_PRIMARY, COLOR_SUCCESS, etc.)

### 4. Error Handling
Every public function includes:
```vba
On Error GoTo ErrorHandler
' ... function code ...
Exit Sub/Function

ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical, modApp.APP_NAME
```

### 5. Screen Update Management
All rendering functions:
```vba
Application.ScreenUpdating = False
' ... rendering code ...
Application.ScreenUpdating = True
```

## Performance Considerations

### Current Optimizations
1. **Screen updating disabled during renders**
2. **Shapes created in batches**
3. **Table queries use filters to reduce data**
4. **Limited visible rows (15-20 per view)**

### Future Optimizations
1. **Pagination for large datasets**
2. **Lazy loading of detail views**
3. **Caching of frequently accessed data**
4. **Background data refresh**

## Extensibility

### Adding a New View

1. **Create render function in modUI:**
```vba
Public Sub RenderMyNewView()
    Application.ScreenUpdating = False
    Call ClearContentArea(GetUISheet())
    ' ... render logic ...
    Application.ScreenUpdating = True
End Sub
```

2. **Add route in modApp.Navigate:**
```vba
Case "MyNewView"
    Call modUI.RenderMyNewView
```

3. **Add navigation button in modNav:**
```vba
Call CreateNavButton(ws, "btnNavMyView", "My View", left, top, width, height, "modApp.Navigate ""MyNewView""")
```

### Adding a New Entity

1. **Create table in modData.InitializeDataTables**
2. **Add CRUD functions in modData**
3. **Add validation in modValidation**
4. **Create render functions in modUI**
5. **Add to navigation if needed**

## Security Considerations

1. **Data sheets are hidden (xlSheetVeryHidden)**
2. **Sheet activation prevented for data sheets**
3. **No external dependencies or internet access**
4. **All data stored locally in workbook**
5. **VBA project can be password protected**

## Platform Compatibility

### Windows Excel
- ✅ Full support
- ✅ All features work
- ✅ ActiveX controls supported (not used)

### Mac Excel
- ✅ Full support
- ✅ All features work
- ⚠️ Some VBA functions may behave slightly differently
- ⚠️ Date handling may vary
- ❌ ActiveX controls not supported (not used in this app)

## Known Limitations

1. **Single-user only** - Not designed for concurrent editing
2. **Data volume** - Optimal for <1000 projects, <5000 tasks
3. **No undo** - VBA actions cannot be undone with Ctrl+Z
4. **No real-time updates** - Manual refresh required
5. **Limited charting** - Uses Excel's built-in charts only

## Future Architecture Enhancements

1. **Class-based entities** - Create clsProject, clsTask, clsPerson classes
2. **Event system** - Implement event handlers for data changes
3. **Plugin architecture** - Allow custom modules to extend functionality
4. **Export/Import** - CSV and JSON data exchange
5. **Backup/Restore** - Automated backup system
