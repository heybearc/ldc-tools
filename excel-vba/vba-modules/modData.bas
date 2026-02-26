Attribute VB_Name = "modData"
Option Explicit

' ============================================================================
' modData - Data Layer (CRUD Operations)
' ============================================================================
' Handles all data operations for Projects, Tasks, People, Settings, and Lookups
' Uses Excel Tables (ListObjects) for structured data storage
' ============================================================================

' Table names
Private Const TBL_PROJECTS As String = "tblProjects"
Private Const TBL_TASKS As String = "tblTasks"
Private Const TBL_PEOPLE As String = "tblPeople"
Private Const TBL_SETTINGS As String = "tblSettings"
Private Const TBL_LOOKUPS As String = "tblLookups"

' Sheet names (hidden data sheets)
Private Const SH_PROJECTS As String = "Data_Projects"
Private Const SH_TASKS As String = "Data_Tasks"
Private Const SH_PEOPLE As String = "Data_People"
Private Const SH_SETTINGS As String = "Data_Settings"
Private Const SH_LOOKUPS As String = "Data_Lookups"

' ============================================================================
' INITIALIZATION
' ============================================================================

Public Sub InitializeDataTables()
    On Error GoTo ErrorHandler
    
    ' Create data sheets if they don't exist
    Call CreateDataSheet(SH_PROJECTS)
    Call CreateDataSheet(SH_TASKS)
    Call CreateDataSheet(SH_PEOPLE)
    Call CreateDataSheet(SH_SETTINGS)
    Call CreateDataSheet(SH_LOOKUPS)
    
    ' Create tables with proper structure
    Call CreateProjectsTable
    Call CreateTasksTable
    Call CreatePeopleTable
    Call CreateSettingsTable
    Call CreateLookupsTable
    
    ' Seed initial data if tables are empty
    Call SeedInitialData
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error initializing data tables: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

Private Sub CreateDataSheet(sheetName As String)
    On Error Resume Next
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(sheetName)
    
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add
        ws.Name = sheetName
        ws.Visible = xlSheetVeryHidden
    End If
    
End Sub

' ============================================================================
' TABLE CREATION
' ============================================================================

Private Sub CreateProjectsTable()
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim tbl As ListObject
    
    Set ws = ThisWorkbook.Worksheets(SH_PROJECTS)
    Set tbl = ws.ListObjects(TBL_PROJECTS)
    
    If tbl Is Nothing Then
        ' Create table with headers
        ws.Range("A1:K1").Value = Array("ProjectID", "Name", "Status", "OwnerID", _
                                        "StartDate", "DueDate", "RiskLevel", "PercentComplete", _
                                        "Notes", "CreatedAt", "UpdatedAt")
        
        Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:K1"), , xlYes)
        tbl.Name = TBL_PROJECTS
        tbl.TableStyle = "TableStyleMedium2"
    End If
    
End Sub

Private Sub CreateTasksTable()
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim tbl As ListObject
    
    Set ws = ThisWorkbook.Worksheets(SH_TASKS)
    Set tbl = ws.ListObjects(TBL_TASKS)
    
    If tbl Is Nothing Then
        ' Create table with headers
        ws.Range("A1:L1").Value = Array("TaskID", "ProjectID", "Title", "Status", _
                                        "AssigneeID", "Priority", "StartDate", "DueDate", _
                                        "CompletedDate", "Notes", "CreatedAt", "UpdatedAt")
        
        Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:L1"), , xlYes)
        tbl.Name = TBL_TASKS
        tbl.TableStyle = "TableStyleMedium2"
    End If
    
End Sub

Private Sub CreatePeopleTable()
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim tbl As ListObject
    
    Set ws = ThisWorkbook.Worksheets(SH_PEOPLE)
    Set tbl = ws.ListObjects(TBL_PEOPLE)
    
    If tbl Is Nothing Then
        ' Create table with headers
        ws.Range("A1:E1").Value = Array("PersonID", "DisplayName", "Email", "Role", "Active")
        
        Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:E1"), , xlYes)
        tbl.Name = TBL_PEOPLE
        tbl.TableStyle = "TableStyleMedium2"
    End If
    
End Sub

Private Sub CreateSettingsTable()
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim tbl As ListObject
    
    Set ws = ThisWorkbook.Worksheets(SH_SETTINGS)
    Set tbl = ws.ListObjects(TBL_SETTINGS)
    
    If tbl Is Nothing Then
        ' Create table with headers
        ws.Range("A1:B1").Value = Array("Key", "Value")
        
        Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:B1"), , xlYes)
        tbl.Name = TBL_SETTINGS
        tbl.TableStyle = "TableStyleMedium2"
    End If
    
End Sub

Private Sub CreateLookupsTable()
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim tbl As ListObject
    
    Set ws = ThisWorkbook.Worksheets(SH_LOOKUPS)
    Set tbl = ws.ListObjects(TBL_LOOKUPS)
    
    If tbl Is Nothing Then
        ' Create table with headers
        ws.Range("A1:E1").Value = Array("Type", "Code", "Label", "SortOrder", "Active")
        
        Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:E1"), , xlYes)
        tbl.Name = TBL_LOOKUPS
        tbl.TableStyle = "TableStyleMedium2"
    End If
    
End Sub

' ============================================================================
' PROJECTS - CRUD OPERATIONS
' ============================================================================

Public Function CreateProject(projectName As String, ownerID As String, _
                              startDate As Date, dueDate As Date, _
                              Optional status As String = "Active", _
                              Optional riskLevel As String = "Low", _
                              Optional percentComplete As Long = 0, _
                              Optional notes As String = "") As String
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim newRow As ListRow
    Dim projectID As String
    
    Set tbl = GetTable(TBL_PROJECTS)
    projectID = modUtils.GenerateID("PRJ")
    
    ' Validate inputs
    If Not modValidation.ValidateProjectData(projectName, ownerID, startDate, dueDate) Then
        CreateProject = ""
        Exit Function
    End If
    
    ' Add new row
    Set newRow = tbl.ListRows.Add
    
    With newRow
        .Range(1, 1).Value = projectID
        .Range(1, 2).Value = projectName
        .Range(1, 3).Value = status
        .Range(1, 4).Value = ownerID
        .Range(1, 5).Value = startDate
        .Range(1, 6).Value = dueDate
        .Range(1, 7).Value = riskLevel
        .Range(1, 8).Value = percentComplete
        .Range(1, 9).Value = notes
        .Range(1, 10).Value = Now
        .Range(1, 11).Value = Now
    End With
    
    CreateProject = projectID
    Exit Function
    
ErrorHandler:
    MsgBox "Error creating project: " & Err.Description, vbCritical, modApp.APP_NAME
    CreateProject = ""
End Function

Public Function UpdateProject(projectID As String, projectName As String, ownerID As String, _
                              startDate As Date, dueDate As Date, status As String, _
                              riskLevel As String, percentComplete As Long, notes As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim row As ListRow
    Dim found As Boolean
    
    Set tbl = GetTable(TBL_PROJECTS)
    found = False
    
    ' Find the project row
    For Each row In tbl.ListRows
        If row.Range(1, 1).Value = projectID Then
            found = True
            
            ' Update fields
            row.Range(1, 2).Value = projectName
            row.Range(1, 3).Value = status
            row.Range(1, 4).Value = ownerID
            row.Range(1, 5).Value = startDate
            row.Range(1, 6).Value = dueDate
            row.Range(1, 7).Value = riskLevel
            row.Range(1, 8).Value = percentComplete
            row.Range(1, 9).Value = notes
            row.Range(1, 11).Value = Now
            
            Exit For
        End If
    Next row
    
    UpdateProject = found
    Exit Function
    
ErrorHandler:
    MsgBox "Error updating project: " & Err.Description, vbCritical, modApp.APP_NAME
    UpdateProject = False
End Function

Public Function DeleteProject(projectID As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim row As ListRow
    Dim i As Long
    
    Set tbl = GetTable(TBL_PROJECTS)
    
    ' Find and delete the project row
    For i = tbl.ListRows.Count To 1 Step -1
        If tbl.ListRows(i).Range(1, 1).Value = projectID Then
            tbl.ListRows(i).Delete
            DeleteProject = True
            Exit Function
        End If
    Next i
    
    DeleteProject = False
    Exit Function
    
ErrorHandler:
    MsgBox "Error deleting project: " & Err.Description, vbCritical, modApp.APP_NAME
    DeleteProject = False
End Function

Public Function GetProject(projectID As String) As Variant
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim row As ListRow
    Dim projectData(1 To 11) As Variant
    
    Set tbl = GetTable(TBL_PROJECTS)
    
    ' Find the project
    For Each row In tbl.ListRows
        If row.Range(1, 1).Value = projectID Then
            Dim i As Long
            For i = 1 To 11
                projectData(i) = row.Range(1, i).Value
            Next i
            GetProject = projectData
            Exit Function
        End If
    Next row
    
    GetProject = Empty
    Exit Function
    
ErrorHandler:
    GetProject = Empty
End Function

Public Function GetAllProjects(Optional filterStatus As String = "", _
                               Optional filterOwner As String = "") As Variant
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim results() As Variant
    Dim row As ListRow
    Dim rowCount As Long
    Dim i As Long
    
    Set tbl = GetTable(TBL_PROJECTS)
    
    If tbl.ListRows.Count = 0 Then
        GetAllProjects = Empty
        Exit Function
    End If
    
    ' Count matching rows
    rowCount = 0
    For Each row In tbl.ListRows
        If (filterStatus = "" Or row.Range(1, 3).Value = filterStatus) And _
           (filterOwner = "" Or row.Range(1, 4).Value = filterOwner) Then
            rowCount = rowCount + 1
        End If
    Next row
    
    If rowCount = 0 Then
        GetAllProjects = Empty
        Exit Function
    End If
    
    ' Build results array
    ReDim results(1 To rowCount, 1 To 11)
    rowCount = 0
    
    For Each row In tbl.ListRows
        If (filterStatus = "" Or row.Range(1, 3).Value = filterStatus) And _
           (filterOwner = "" Or row.Range(1, 4).Value = filterOwner) Then
            rowCount = rowCount + 1
            For i = 1 To 11
                results(rowCount, i) = row.Range(1, i).Value
            Next i
        End If
    Next row
    
    GetAllProjects = results
    Exit Function
    
ErrorHandler:
    GetAllProjects = Empty
End Function

' ============================================================================
' TASKS - CRUD OPERATIONS
' ============================================================================

Public Function CreateTask(projectID As String, title As String, assigneeID As String, _
                           Optional status As String = "Not Started", _
                           Optional priority As String = "Medium", _
                           Optional startDate As Variant = "", _
                           Optional dueDate As Variant = "", _
                           Optional notes As String = "") As String
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim newRow As ListRow
    Dim taskID As String
    
    Set tbl = GetTable(TBL_TASKS)
    taskID = modUtils.GenerateID("TSK")
    
    ' Add new row
    Set newRow = tbl.ListRows.Add
    
    With newRow
        .Range(1, 1).Value = taskID
        .Range(1, 2).Value = projectID
        .Range(1, 3).Value = title
        .Range(1, 4).Value = status
        .Range(1, 5).Value = assigneeID
        .Range(1, 6).Value = priority
        .Range(1, 7).Value = IIf(startDate = "", "", CDate(startDate))
        .Range(1, 8).Value = IIf(dueDate = "", "", CDate(dueDate))
        .Range(1, 9).Value = ""
        .Range(1, 10).Value = notes
        .Range(1, 11).Value = Now
        .Range(1, 12).Value = Now
    End With
    
    CreateTask = taskID
    Exit Function
    
ErrorHandler:
    MsgBox "Error creating task: " & Err.Description, vbCritical, modApp.APP_NAME
    CreateTask = ""
End Function

Public Function UpdateTask(taskID As String, title As String, status As String, _
                           assigneeID As String, priority As String, _
                           startDate As Variant, dueDate As Variant, notes As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim row As ListRow
    Dim found As Boolean
    
    Set tbl = GetTable(TBL_TASKS)
    found = False
    
    ' Find the task row
    For Each row In tbl.ListRows
        If row.Range(1, 1).Value = taskID Then
            found = True
            
            ' Update fields
            row.Range(1, 3).Value = title
            row.Range(1, 4).Value = status
            row.Range(1, 5).Value = assigneeID
            row.Range(1, 6).Value = priority
            row.Range(1, 7).Value = IIf(startDate = "", "", CDate(startDate))
            row.Range(1, 8).Value = IIf(dueDate = "", "", CDate(dueDate))
            row.Range(1, 10).Value = notes
            row.Range(1, 12).Value = Now
            
            ' Set completed date if status is Completed
            If status = "Completed" And row.Range(1, 9).Value = "" Then
                row.Range(1, 9).Value = Now
            ElseIf status <> "Completed" Then
                row.Range(1, 9).Value = ""
            End If
            
            Exit For
        End If
    Next row
    
    UpdateTask = found
    Exit Function
    
ErrorHandler:
    MsgBox "Error updating task: " & Err.Description, vbCritical, modApp.APP_NAME
    UpdateTask = False
End Function

Public Function CompleteTask(taskID As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim row As ListRow
    
    Set tbl = GetTable(TBL_TASKS)
    
    For Each row In tbl.ListRows
        If row.Range(1, 1).Value = taskID Then
            row.Range(1, 4).Value = "Completed"
            row.Range(1, 9).Value = Now
            row.Range(1, 12).Value = Now
            CompleteTask = True
            Exit Function
        End If
    Next row
    
    CompleteTask = False
    Exit Function
    
ErrorHandler:
    CompleteTask = False
End Function

Public Function GetTasksByProject(projectID As String) As Variant
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim results() As Variant
    Dim row As ListRow
    Dim rowCount As Long
    Dim i As Long
    
    Set tbl = GetTable(TBL_TASKS)
    
    ' Count matching rows
    rowCount = 0
    For Each row In tbl.ListRows
        If row.Range(1, 2).Value = projectID Then
            rowCount = rowCount + 1
        End If
    Next row
    
    If rowCount = 0 Then
        GetTasksByProject = Empty
        Exit Function
    End If
    
    ' Build results array
    ReDim results(1 To rowCount, 1 To 12)
    rowCount = 0
    
    For Each row In tbl.ListRows
        If row.Range(1, 2).Value = projectID Then
            rowCount = rowCount + 1
            For i = 1 To 12
                results(rowCount, i) = row.Range(1, i).Value
            Next i
        End If
    Next row
    
    GetTasksByProject = results
    Exit Function
    
ErrorHandler:
    GetTasksByProject = Empty
End Function

Public Function GetAllTasks(Optional filterStatus As String = "", _
                            Optional filterAssignee As String = "") As Variant
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim results() As Variant
    Dim row As ListRow
    Dim rowCount As Long
    Dim i As Long
    
    Set tbl = GetTable(TBL_TASKS)
    
    If tbl.ListRows.Count = 0 Then
        GetAllTasks = Empty
        Exit Function
    End If
    
    ' Count matching rows
    rowCount = 0
    For Each row In tbl.ListRows
        If (filterStatus = "" Or row.Range(1, 4).Value = filterStatus) And _
           (filterAssignee = "" Or row.Range(1, 5).Value = filterAssignee) Then
            rowCount = rowCount + 1
        End If
    Next row
    
    If rowCount = 0 Then
        GetAllTasks = Empty
        Exit Function
    End If
    
    ' Build results array
    ReDim results(1 To rowCount, 1 To 12)
    rowCount = 0
    
    For Each row In tbl.ListRows
        If (filterStatus = "" Or row.Range(1, 4).Value = filterStatus) And _
           (filterAssignee = "" Or row.Range(1, 5).Value = filterAssignee) Then
            rowCount = rowCount + 1
            For i = 1 To 12
                results(rowCount, i) = row.Range(1, i).Value
            Next i
        End If
    Next row
    
    GetAllTasks = results
    Exit Function
    
ErrorHandler:
    GetAllTasks = Empty
End Function

' ============================================================================
' PEOPLE - CRUD OPERATIONS
' ============================================================================

Public Function CreatePerson(displayName As String, email As String, _
                             role As String, Optional active As Boolean = True) As String
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim newRow As ListRow
    Dim personID As String
    
    Set tbl = GetTable(TBL_PEOPLE)
    personID = modUtils.GenerateID("PER")
    
    ' Add new row
    Set newRow = tbl.ListRows.Add
    
    With newRow
        .Range(1, 1).Value = personID
        .Range(1, 2).Value = displayName
        .Range(1, 3).Value = email
        .Range(1, 4).Value = role
        .Range(1, 5).Value = active
    End With
    
    CreatePerson = personID
    Exit Function
    
ErrorHandler:
    MsgBox "Error creating person: " & Err.Description, vbCritical, modApp.APP_NAME
    CreatePerson = ""
End Function

Public Function GetAllPeople(Optional activeOnly As Boolean = True) As Variant
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim results() As Variant
    Dim row As ListRow
    Dim rowCount As Long
    Dim i As Long
    
    Set tbl = GetTable(TBL_PEOPLE)
    
    If tbl.ListRows.Count = 0 Then
        GetAllPeople = Empty
        Exit Function
    End If
    
    ' Count matching rows
    rowCount = 0
    For Each row In tbl.ListRows
        If Not activeOnly Or row.Range(1, 5).Value = True Then
            rowCount = rowCount + 1
        End If
    Next row
    
    If rowCount = 0 Then
        GetAllPeople = Empty
        Exit Function
    End If
    
    ' Build results array
    ReDim results(1 To rowCount, 1 To 5)
    rowCount = 0
    
    For Each row In tbl.ListRows
        If Not activeOnly Or row.Range(1, 5).Value = True Then
            rowCount = rowCount + 1
            For i = 1 To 5
                results(rowCount, i) = row.Range(1, i).Value
            Next i
        End If
    Next row
    
    GetAllPeople = results
    Exit Function
    
ErrorHandler:
    GetAllPeople = Empty
End Function

' ============================================================================
' LOOKUPS - OPERATIONS
' ============================================================================

Public Function GetLookupValues(lookupType As String) As Variant
    On Error GoTo ErrorHandler
    
    Dim tbl As ListObject
    Dim results() As String
    Dim row As ListRow
    Dim count As Long
    
    Set tbl = GetTable(TBL_LOOKUPS)
    
    ' Count matching active lookups
    count = 0
    For Each row In tbl.ListRows
        If row.Range(1, 1).Value = lookupType And row.Range(1, 5).Value = True Then
            count = count + 1
        End If
    Next row
    
    If count = 0 Then
        GetLookupValues = Array()
        Exit Function
    End If
    
    ' Build results array
    ReDim results(1 To count)
    count = 0
    
    For Each row In tbl.ListRows
        If row.Range(1, 1).Value = lookupType And row.Range(1, 5).Value = True Then
            count = count + 1
            results(count) = row.Range(1, 3).Value
        End If
    Next row
    
    GetLookupValues = results
    Exit Function
    
ErrorHandler:
    GetLookupValues = Array()
End Function

' ============================================================================
' SEED DATA
' ============================================================================

Private Sub SeedInitialData()
    On Error Resume Next
    
    ' Seed lookups if empty
    If GetTable(TBL_LOOKUPS).ListRows.Count = 0 Then
        Call SeedLookups
    End If
    
    ' Seed default people if empty
    If GetTable(TBL_PEOPLE).ListRows.Count = 0 Then
        Call SeedPeople
    End If
    
    ' Seed sample project if empty
    If GetTable(TBL_PROJECTS).ListRows.Count = 0 Then
        Call SeedSampleProject
    End If
    
End Sub

Private Sub SeedLookups()
    Dim tbl As ListObject
    Set tbl = GetTable(TBL_LOOKUPS)
    
    ' Project Statuses
    Call AddLookup(tbl, "ProjectStatus", "ACTIVE", "Active", 1, True)
    Call AddLookup(tbl, "ProjectStatus", "ONHOLD", "On Hold", 2, True)
    Call AddLookup(tbl, "ProjectStatus", "COMPLETED", "Completed", 3, True)
    Call AddLookup(tbl, "ProjectStatus", "CANCELLED", "Cancelled", 4, True)
    
    ' Risk Levels
    Call AddLookup(tbl, "RiskLevel", "LOW", "Low", 1, True)
    Call AddLookup(tbl, "RiskLevel", "MEDIUM", "Medium", 2, True)
    Call AddLookup(tbl, "RiskLevel", "HIGH", "High", 3, True)
    Call AddLookup(tbl, "RiskLevel", "CRITICAL", "Critical", 4, True)
    
    ' Task Statuses
    Call AddLookup(tbl, "TaskStatus", "NOTSTARTED", "Not Started", 1, True)
    Call AddLookup(tbl, "TaskStatus", "INPROGRESS", "In Progress", 2, True)
    Call AddLookup(tbl, "TaskStatus", "COMPLETED", "Completed", 3, True)
    Call AddLookup(tbl, "TaskStatus", "BLOCKED", "Blocked", 4, True)
    
    ' Priorities
    Call AddLookup(tbl, "Priority", "LOW", "Low", 1, True)
    Call AddLookup(tbl, "Priority", "MEDIUM", "Medium", 2, True)
    Call AddLookup(tbl, "Priority", "HIGH", "High", 3, True)
    Call AddLookup(tbl, "Priority", "CRITICAL", "Critical", 4, True)
    
    ' Roles
    Call AddLookup(tbl, "Role", "PM", "Project Manager", 1, True)
    Call AddLookup(tbl, "Role", "CONTRIBUTOR", "Contributor", 2, True)
    Call AddLookup(tbl, "Role", "ADMIN", "Admin", 3, True)
    
End Sub

Private Sub AddLookup(tbl As ListObject, lookupType As String, code As String, _
                      label As String, sortOrder As Long, active As Boolean)
    Dim newRow As ListRow
    Set newRow = tbl.ListRows.Add
    
    With newRow
        .Range(1, 1).Value = lookupType
        .Range(1, 2).Value = code
        .Range(1, 3).Value = label
        .Range(1, 4).Value = sortOrder
        .Range(1, 5).Value = active
    End With
End Sub

Private Sub SeedPeople()
    Call CreatePerson("System Admin", "admin@ldctools.local", "Admin", True)
    Call CreatePerson("John Smith", "john.smith@ldctools.local", "Project Manager", True)
    Call CreatePerson("Jane Doe", "jane.doe@ldctools.local", "Contributor", True)
End Sub

Private Sub SeedSampleProject()
    Dim personID As String
    Dim projectID As String
    
    ' Get first person ID
    Dim people As Variant
    people = GetAllPeople(True)
    
    If Not IsEmpty(people) Then
        personID = people(1, 1)
        
        ' Create sample project
        projectID = CreateProject("Sample Construction Project", personID, _
                                  Date, DateAdd("m", 3, Date), _
                                  "Active", "Low", 0, _
                                  "This is a sample project to demonstrate LDC Tools v2")
        
        ' Create sample tasks
        If projectID <> "" Then
            Call CreateTask(projectID, "Site preparation", personID, "In Progress", "High", Date, DateAdd("d", 7, Date), "")
            Call CreateTask(projectID, "Foundation work", personID, "Not Started", "High", DateAdd("d", 8, Date), DateAdd("d", 21, Date), "")
            Call CreateTask(projectID, "Framing", personID, "Not Started", "Medium", DateAdd("d", 22, Date), DateAdd("d", 45, Date), "")
        End If
    End If
End Sub

' ============================================================================
' UTILITY FUNCTIONS
' ============================================================================

Private Function GetTable(tableName As String) As ListObject
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim tbl As ListObject
    
    ' Determine which sheet based on table name
    Select Case tableName
        Case TBL_PROJECTS
            Set ws = ThisWorkbook.Worksheets(SH_PROJECTS)
        Case TBL_TASKS
            Set ws = ThisWorkbook.Worksheets(SH_TASKS)
        Case TBL_PEOPLE
            Set ws = ThisWorkbook.Worksheets(SH_PEOPLE)
        Case TBL_SETTINGS
            Set ws = ThisWorkbook.Worksheets(SH_SETTINGS)
        Case TBL_LOOKUPS
            Set ws = ThisWorkbook.Worksheets(SH_LOOKUPS)
    End Select
    
    If Not ws Is Nothing Then
        Set tbl = ws.ListObjects(tableName)
    End If
    
    Set GetTable = tbl
    
End Function
