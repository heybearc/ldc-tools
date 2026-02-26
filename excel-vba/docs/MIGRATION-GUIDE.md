# Migration Guide - Web to Excel VBA

## Overview

This guide helps you migrate data from the web-based LDC Tools to the Excel VBA version.

## Migration Strategy

There are two approaches to migration:

1. **Manual Export/Import** - Export data from web app, import to Excel
2. **Database Export** - Direct database export to CSV, import to Excel

## Option 1: Manual Export/Import

### Step 1: Export from Web Application

**Projects:**
1. Log into LDC Tools web app
2. Navigate to Projects page
3. Click "Export" button
4. Save as `projects.csv`

**Tasks:**
1. Navigate to Tasks page
2. Click "Export" button
3. Save as `tasks.csv`

**People:**
1. Navigate to Admin > Users
2. Click "Export" button
3. Save as `people.csv`

### Step 2: Prepare CSV Files

Ensure CSV files have these columns:

**projects.csv:**
```
ProjectID,Name,Status,Owner,StartDate,DueDate,RiskLevel,PercentComplete,Notes
```

**tasks.csv:**
```
TaskID,ProjectID,Title,Status,Assignee,Priority,StartDate,DueDate,Notes
```

**people.csv:**
```
PersonID,DisplayName,Email,Role
```

### Step 3: Import to Excel VBA

1. Open `LDC-Tools-v2.xlsm`
2. Press `Alt+F11` to open VBA Editor
3. View > Immediate Window
4. Run import commands:

```vba
' Import projects
Call ImportProjectsFromCSV("C:\path\to\projects.csv")

' Import tasks
Call ImportTasksFromCSV("C:\path\to\tasks.csv")

' Import people
Call ImportPeopleFromCSV("C:\path\to\people.csv")
```

### Step 4: Verify Data

1. Navigate to Projects view
2. Verify all projects appear
3. Click on a project to verify tasks
4. Check People view for all users

## Option 2: Database Export

### Step 1: Export from PostgreSQL

**Connect to database:**
```bash
psql -h 10.92.3.21 -U ldc_user -d ldc_tools
```

**Export projects:**
```sql
\COPY (
    SELECT 
        id as ProjectID,
        name as Name,
        status as Status,
        owner_id as OwnerID,
        start_date as StartDate,
        due_date as DueDate,
        risk_level as RiskLevel,
        percent_complete as PercentComplete,
        notes as Notes
    FROM projects
    WHERE deleted_at IS NULL
) TO 'projects.csv' WITH CSV HEADER;
```

**Export tasks:**
```sql
\COPY (
    SELECT 
        id as TaskID,
        project_id as ProjectID,
        title as Title,
        status as Status,
        assignee_id as AssigneeID,
        priority as Priority,
        start_date as StartDate,
        due_date as DueDate,
        notes as Notes
    FROM tasks
    WHERE deleted_at IS NULL
) TO 'tasks.csv' WITH CSV HEADER;
```

**Export people:**
```sql
\COPY (
    SELECT 
        id as PersonID,
        display_name as DisplayName,
        email as Email,
        role as Role
    FROM users
    WHERE active = true
) TO 'people.csv' WITH CSV HEADER;
```

### Step 2: Import to Excel

Follow Step 3 and 4 from Option 1 above.

## Data Mapping

### Status Values

**Web App → Excel VBA:**
- `ACTIVE` → `Active`
- `ON_HOLD` → `On Hold`
- `COMPLETED` → `Completed`
- `CANCELLED` → `Cancelled`

**Task Status:**
- `NOT_STARTED` → `Not Started`
- `IN_PROGRESS` → `In Progress`
- `COMPLETED` → `Completed`
- `BLOCKED` → `Blocked`

### Risk Levels

- `LOW` → `Low`
- `MEDIUM` → `Medium`
- `HIGH` → `High`
- `CRITICAL` → `Critical`

### Priorities

- `LOW` → `Low`
- `MEDIUM` → `Medium`
- `HIGH` → `High`
- `CRITICAL` → `Critical`

### Roles

- `PM` → `Project Manager`
- `CONTRIBUTOR` → `Contributor`
- `ADMIN` → `Admin`

## Import Helper Functions

Add these functions to `modData.bas` for CSV import:

```vba
Public Sub ImportProjectsFromCSV(filePath As String)
    On Error GoTo ErrorHandler
    
    Dim fso As Object
    Dim ts As Object
    Dim line As String
    Dim fields() As String
    Dim i As Long
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.OpenTextFile(filePath, 1)
    
    ' Skip header row
    If Not ts.AtEndOfStream Then
        line = ts.ReadLine
    End If
    
    ' Read data rows
    Do While Not ts.AtEndOfStream
        line = ts.ReadLine
        fields = Split(line, ",")
        
        ' Create project
        Call CreateProject(fields(1), fields(3), CDate(fields(4)), _
                          CDate(fields(5)), fields(2), fields(6), _
                          CLng(fields(7)), fields(8))
    Loop
    
    ts.Close
    Set ts = Nothing
    Set fso = Nothing
    
    MsgBox "Projects imported successfully!", vbInformation, modApp.APP_NAME
    Exit Sub
    
ErrorHandler:
    MsgBox "Error importing projects: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

Public Sub ImportTasksFromCSV(filePath As String)
    On Error GoTo ErrorHandler
    
    Dim fso As Object
    Dim ts As Object
    Dim line As String
    Dim fields() As String
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.OpenTextFile(filePath, 1)
    
    ' Skip header row
    If Not ts.AtEndOfStream Then
        line = ts.ReadLine
    End If
    
    ' Read data rows
    Do While Not ts.AtEndOfStream
        line = ts.ReadLine
        fields = Split(line, ",")
        
        ' Create task
        Call CreateTask(fields(1), fields(2), fields(4), fields(3), _
                       fields(5), fields(6), fields(7), fields(8))
    Loop
    
    ts.Close
    Set ts = Nothing
    Set fso = Nothing
    
    MsgBox "Tasks imported successfully!", vbInformation, modApp.APP_NAME
    Exit Sub
    
ErrorHandler:
    MsgBox "Error importing tasks: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

Public Sub ImportPeopleFromCSV(filePath As String)
    On Error GoTo ErrorHandler
    
    Dim fso As Object
    Dim ts As Object
    Dim line As String
    Dim fields() As String
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.OpenTextFile(filePath, 1)
    
    ' Skip header row
    If Not ts.AtEndOfStream Then
        line = ts.ReadLine
    End If
    
    ' Read data rows
    Do While Not ts.AtEndOfStream
        line = ts.ReadLine
        fields = Split(line, ",")
        
        ' Create person
        Call CreatePerson(fields(1), fields(2), fields(3), True)
    Loop
    
    ts.Close
    Set ts = Nothing
    Set fso = Nothing
    
    MsgBox "People imported successfully!", vbInformation, modApp.APP_NAME
    Exit Sub
    
ErrorHandler:
    MsgBox "Error importing people: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub
```

## Post-Migration Checklist

After migration, verify:

- [ ] All projects imported correctly
- [ ] Project counts match web app
- [ ] All tasks imported correctly
- [ ] Task-to-project relationships intact
- [ ] All people imported correctly
- [ ] Status values mapped correctly
- [ ] Dates formatted correctly
- [ ] No data loss or corruption
- [ ] Dashboard KPIs show correct numbers
- [ ] Project detail views show tasks
- [ ] No error messages

## Troubleshooting

### "Type mismatch" errors during import
- Check date formats in CSV (use YYYY-MM-DD)
- Verify numeric fields contain only numbers
- Remove any special characters from text fields

### Missing relationships (tasks not showing in projects)
- Verify ProjectID in tasks.csv matches ProjectID in projects.csv
- Check for leading/trailing spaces in IDs
- Ensure IDs are consistent (case-sensitive)

### Duplicate records
- Check for duplicate IDs in CSV files
- Remove duplicates before import
- Use unique IDs from web app database

### Import fails partway through
- Check CSV file encoding (should be UTF-8)
- Look for commas within field values (should be quoted)
- Verify file is not locked by another program

## Rollback Plan

If migration fails:

1. Close Excel workbook without saving
2. Reopen workbook (will have original sample data)
3. Review error messages
4. Fix CSV files
5. Retry import

## Parallel Operation

You can run both systems in parallel during transition:

1. **Week 1-2:** Import data, test Excel version
2. **Week 3-4:** Use both systems, compare results
3. **Week 5:** Full cutover to Excel version
4. **Week 6:** Archive web version data

## Support

For migration issues:
- Review CSV file formats
- Check data types and formats
- Verify ID relationships
- Test with small dataset first
- Contact support if needed
