Attribute VB_Name = "modUI"
Option Explicit

' ============================================================================
' modUI - UI Rendering and Display
' ============================================================================
' Handles rendering of all views: Dashboard, Projects, Tasks, People, Reports, Admin
' ============================================================================

' UI Layout constants
Private Const CONTENT_LEFT As Double = 150
Private Const CONTENT_TOP As Double = 80
Private Const CONTENT_WIDTH As Double = 1000
Private Const CARD_HEIGHT As Double = 100
Private Const CARD_SPACING As Double = 15

' Color scheme
Private Const COLOR_CARD_BG As Long = 16777215        ' White
Private Const COLOR_CARD_BORDER As Long = 12632256    ' Light blue
Private Const COLOR_PRIMARY As Long = 5296274         ' Blue
Private Const COLOR_SUCCESS As Long = 5287936         ' Green
Private Const COLOR_WARNING As Long = 49407           ' Orange
Private Const COLOR_DANGER As Long = 255              ' Red
Private Const COLOR_TEXT_DARK As Long = 3355443       ' Dark gray
Private Const COLOR_TEXT_LIGHT As Long = 8421504      ' Gray

' ============================================================================
' DASHBOARD VIEW
' ============================================================================

Public Sub RenderDashboard()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    ' Clear content area
    Call ClearContentArea(ws)
    
    ' Get data for KPIs
    Dim allProjects As Variant
    Dim allTasks As Variant
    allProjects = modData.GetAllProjects()
    allTasks = modData.GetAllTasks()
    
    ' Calculate KPIs
    Dim totalProjects As Long
    Dim openTasks As Long
    Dim atRiskProjects As Long
    Dim dueThisWeek As Long
    
    totalProjects = 0
    openTasks = 0
    atRiskProjects = 0
    dueThisWeek = 0
    
    If Not IsEmpty(allProjects) Then
        totalProjects = UBound(allProjects, 1)
        
        ' Count at-risk projects
        Dim i As Long
        For i = 1 To UBound(allProjects, 1)
            If allProjects(i, 7) = "High" Or allProjects(i, 7) = "Critical" Then
                atRiskProjects = atRiskProjects + 1
            End If
        Next i
    End If
    
    If Not IsEmpty(allTasks) Then
        ' Count open tasks
        For i = 1 To UBound(allTasks, 1)
            If allTasks(i, 4) <> "Completed" Then
                openTasks = openTasks + 1
            End If
            
            ' Count tasks due this week
            If Not IsEmpty(allTasks(i, 8)) Then
                If allTasks(i, 8) >= Date And allTasks(i, 8) <= Date + 7 Then
                    dueThisWeek = dueThisWeek + 1
                End If
            End If
        Next i
    End If
    
    ' Render KPI cards
    Dim cardTop As Double
    Dim cardLeft As Double
    cardTop = CONTENT_TOP
    cardLeft = CONTENT_LEFT
    
    Call RenderKPICard(ws, "Total Projects", totalProjects, cardLeft, cardTop, COLOR_PRIMARY)
    cardLeft = cardLeft + 240
    
    Call RenderKPICard(ws, "Open Tasks", openTasks, cardLeft, cardTop, COLOR_SUCCESS)
    cardLeft = cardLeft + 240
    
    Call RenderKPICard(ws, "At Risk", atRiskProjects, cardLeft, cardTop, COLOR_DANGER)
    cardLeft = cardLeft + 240
    
    Call RenderKPICard(ws, "Due This Week", dueThisWeek, cardLeft, cardTop, COLOR_WARNING)
    
    ' Render Recent Projects section
    cardTop = cardTop + CARD_HEIGHT + 30
    Call RenderRecentProjects(ws, CONTENT_LEFT, cardTop, allProjects)
    
    ' Render Quick Actions
    cardTop = cardTop + 250
    Call RenderQuickActions(ws, CONTENT_LEFT, cardTop)
    
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error rendering dashboard: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

Private Sub RenderKPICard(ws As Worksheet, title As String, value As Long, _
                          left As Double, top As Double, color As Long)
    On Error Resume Next
    
    Dim card As Shape
    Dim titleShape As Shape
    Dim valueShape As Shape
    
    ' Create card background
    Set card = ws.Shapes.AddShape(msoShapeRoundedRectangle, left, top, 220, 90)
    With card
        .Fill.ForeColor.RGB = COLOR_CARD_BG
        .Line.ForeColor.RGB = COLOR_CARD_BORDER
        .Line.Weight = 1
    End With
    
    ' Create title
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 10, 200, 20)
    With titleShape
        .TextFrame2.TextRange.Text = title
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Create value
    Set valueShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 35, 200, 40)
    With valueShape
        .TextFrame2.TextRange.Text = CStr(value)
        .TextFrame2.TextRange.Font.Size = 32
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = color
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
End Sub

Private Sub RenderRecentProjects(ws As Worksheet, left As Double, top As Double, projects As Variant)
    On Error Resume Next
    
    Dim titleShape As Shape
    
    ' Section title
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left, top, 400, 25)
    With titleShape
        .TextFrame2.TextRange.Text = "Recent Projects"
        .TextFrame2.TextRange.Font.Size = 16
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Render project list (max 5)
    If Not IsEmpty(projects) Then
        Dim i As Long
        Dim maxProjects As Long
        maxProjects = Application.WorksheetFunction.Min(5, UBound(projects, 1))
        
        Dim itemTop As Double
        itemTop = top + 35
        
        For i = 1 To maxProjects
            Call RenderProjectListItem(ws, left, itemTop, projects(i, 1), projects(i, 2), projects(i, 3))
            itemTop = itemTop + 35
        Next i
    Else
        ' No projects message
        Dim noDataShape As Shape
        Set noDataShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left, top + 35, 400, 25)
        With noDataShape
            .TextFrame2.TextRange.Text = "No projects yet. Click 'New Project' to get started."
            .TextFrame2.TextRange.Font.Size = 11
            .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
            .Fill.Visible = msoFalse
            .Line.Visible = msoFalse
        End With
    End If
    
End Sub

Private Sub RenderProjectListItem(ws As Worksheet, left As Double, top As Double, _
                                  projectID As String, projectName As String, status As String)
    On Error Resume Next
    
    Dim itemBg As Shape
    Dim nameShape As Shape
    Dim statusShape As Shape
    
    ' Background
    Set itemBg = ws.Shapes.AddShape(msoShapeRectangle, left, top, 600, 30)
    With itemBg
        .Fill.ForeColor.RGB = RGB(248, 249, 250)
        .Line.Visible = msoFalse
        .OnAction = "modApp.Navigate ""ProjectDetail"", """ & projectID & """"
    End With
    
    ' Project name
    Set nameShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 5, 400, 20)
    With nameShape
        .TextFrame2.TextRange.Text = projectName
        .TextFrame2.TextRange.Font.Size = 11
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Status badge
    Set statusShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 420, top + 5, 100, 20)
    With statusShape
        .TextFrame2.TextRange.Text = status
        .TextFrame2.TextRange.Font.Size = 9
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
End Sub

Private Sub RenderQuickActions(ws As Worksheet, left As Double, top As Double)
    On Error Resume Next
    
    Dim btnNewProject As Shape
    Dim btnNewTask As Shape
    
    ' New Project button
    Set btnNewProject = ws.Shapes.AddShape(msoShapeRoundedRectangle, left, top, 150, 40)
    With btnNewProject
        .TextFrame2.TextRange.Text = "New Project"
        .TextFrame2.TextRange.Font.Size = 12
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.ForeColor.RGB = COLOR_PRIMARY
        .Line.Visible = msoFalse
        .OnAction = "modUI.ShowNewProjectForm"
    End With
    
    ' New Task button
    Set btnNewTask = ws.Shapes.AddShape(msoShapeRoundedRectangle, left + 165, top, 150, 40)
    With btnNewTask
        .TextFrame2.TextRange.Text = "New Task"
        .TextFrame2.TextRange.Font.Size = 12
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.ForeColor.RGB = COLOR_SUCCESS
        .Line.Visible = msoFalse
        .OnAction = "modUI.ShowNewTaskForm"
    End With
    
End Sub

' ============================================================================
' PROJECTS LIST VIEW
' ============================================================================

Public Sub RenderProjectsList()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    Call ClearContentArea(ws)
    
    ' Section title
    Dim titleShape As Shape
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP, 400, 30)
    With titleShape
        .TextFrame2.TextRange.Text = "Projects"
        .TextFrame2.TextRange.Font.Size = 20
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' New Project button
    Dim btnNew As Shape
    Set btnNew = ws.Shapes.AddShape(msoShapeRoundedRectangle, CONTENT_LEFT + 850, CONTENT_TOP, 120, 30)
    With btnNew
        .TextFrame2.TextRange.Text = "New Project"
        .TextFrame2.TextRange.Font.Size = 11
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.ForeColor.RGB = COLOR_PRIMARY
        .Line.Visible = msoFalse
        .OnAction = "modUI.ShowNewProjectForm"
    End With
    
    ' Get projects data
    Dim projects As Variant
    projects = modData.GetAllProjects()
    
    ' Render projects table
    If Not IsEmpty(projects) Then
        Call RenderProjectsTable(ws, CONTENT_LEFT, CONTENT_TOP + 50, projects)
    Else
        Dim noDataShape As Shape
        Set noDataShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP + 60, 600, 30)
        With noDataShape
            .TextFrame2.TextRange.Text = "No projects found. Click 'New Project' to create one."
            .TextFrame2.TextRange.Font.Size = 12
            .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
            .Fill.Visible = msoFalse
            .Line.Visible = msoFalse
        End With
    End If
    
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error rendering projects list: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

Private Sub RenderProjectsTable(ws As Worksheet, left As Double, top As Double, projects As Variant)
    On Error Resume Next
    
    Dim i As Long
    Dim rowTop As Double
    
    ' Table header
    Call RenderTableHeader(ws, left, top, Array("Project Name", "Status", "Owner", "Due Date", "Risk", "% Complete"))
    
    rowTop = top + 30
    
    ' Render rows
    For i = 1 To UBound(projects, 1)
        Call RenderProjectRow(ws, left, rowTop, projects(i, 1), projects(i, 2), _
                             projects(i, 3), projects(i, 6), projects(i, 7), projects(i, 8))
        rowTop = rowTop + 35
        
        If i >= 15 Then Exit For ' Limit to 15 visible rows
    Next i
    
End Sub

Private Sub RenderTableHeader(ws As Worksheet, left As Double, top As Double, headers As Variant)
    On Error Resume Next
    
    Dim headerBg As Shape
    Dim i As Long
    Dim colLeft As Double
    Dim colWidth As Double
    
    ' Background
    Set headerBg = ws.Shapes.AddShape(msoShapeRectangle, left, top, 950, 25)
    With headerBg
        .Fill.ForeColor.RGB = RGB(248, 249, 250)
        .Line.Visible = msoFalse
    End With
    
    ' Column widths
    Dim widths As Variant
    widths = Array(300, 100, 150, 120, 100, 100)
    
    colLeft = left + 5
    
    For i = LBound(headers) To UBound(headers)
        Dim headerText As Shape
        Set headerText = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, colLeft, top + 3, widths(i), 20)
        With headerText
            .TextFrame2.TextRange.Text = headers(i)
            .TextFrame2.TextRange.Font.Size = 10
            .TextFrame2.TextRange.Font.Bold = msoTrue
            .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
            .Fill.Visible = msoFalse
            .Line.Visible = msoFalse
        End With
        colLeft = colLeft + widths(i) + 10
    Next i
    
End Sub

Private Sub RenderProjectRow(ws As Worksheet, left As Double, top As Double, _
                             projectID As String, projectName As String, status As String, _
                             dueDate As Variant, riskLevel As String, percentComplete As Long)
    On Error Resume Next
    
    Dim rowBg As Shape
    Dim colLeft As Double
    Dim widths As Variant
    widths = Array(300, 100, 150, 120, 100, 100)
    
    ' Row background (clickable)
    Set rowBg = ws.Shapes.AddShape(msoShapeRectangle, left, top, 950, 30)
    With rowBg
        .Fill.ForeColor.RGB = RGB(255, 255, 255)
        .Line.ForeColor.RGB = RGB(230, 230, 230)
        .Line.Weight = 0.5
        .OnAction = "modApp.Navigate ""ProjectDetail"", """ & projectID & """"
    End With
    
    colLeft = left + 5
    
    ' Project Name
    Call AddTableCell(ws, colLeft, top + 5, widths(0), projectName, COLOR_TEXT_DARK, False)
    colLeft = colLeft + widths(0) + 10
    
    ' Status
    Call AddTableCell(ws, colLeft, top + 5, widths(1), status, GetStatusColor(status), False)
    colLeft = colLeft + widths(1) + 10
    
    ' Owner (placeholder - would lookup person name)
    Call AddTableCell(ws, colLeft, top + 5, widths(2), "Owner", COLOR_TEXT_LIGHT, False)
    colLeft = colLeft + widths(2) + 10
    
    ' Due Date
    Dim dueDateText As String
    If IsEmpty(dueDate) Then
        dueDateText = "-"
    Else
        dueDateText = Format(dueDate, "mm/dd/yyyy")
    End If
    Call AddTableCell(ws, colLeft, top + 5, widths(3), dueDateText, COLOR_TEXT_DARK, False)
    colLeft = colLeft + widths(3) + 10
    
    ' Risk Level
    Call AddTableCell(ws, colLeft, top + 5, widths(4), riskLevel, GetRiskColor(riskLevel), False)
    colLeft = colLeft + widths(4) + 10
    
    ' % Complete
    Call AddTableCell(ws, colLeft, top + 5, widths(5), percentComplete & "%", COLOR_TEXT_DARK, False)
    
End Sub

Private Sub AddTableCell(ws As Worksheet, left As Double, top As Double, width As Double, _
                        text As String, color As Long, bold As Boolean)
    On Error Resume Next
    
    Dim cellText As Shape
    Set cellText = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left, top, width, 20)
    With cellText
        .TextFrame2.TextRange.Text = text
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Bold = IIf(bold, msoTrue, msoFalse)
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = color
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
End Sub

' ============================================================================
' PROJECT DETAIL VIEW
' ============================================================================

Public Sub RenderProjectDetail(projectID As String)
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    Call ClearContentArea(ws)
    
    ' Get project data
    Dim project As Variant
    project = modData.GetProject(projectID)
    
    If IsEmpty(project) Then
        MsgBox "Project not found: " & projectID, vbExclamation, modApp.APP_NAME
        Call modApp.Navigate("Projects")
        Exit Sub
    End If
    
    ' Back button
    Dim btnBack As Shape
    Set btnBack = ws.Shapes.AddShape(msoShapeRoundedRectangle, CONTENT_LEFT, CONTENT_TOP, 80, 30)
    With btnBack
        .TextFrame2.TextRange.Text = "← Back"
        .TextFrame2.TextRange.Font.Size = 11
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_PRIMARY
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.ForeColor.RGB = RGB(255, 255, 255)
        .Line.ForeColor.RGB = COLOR_PRIMARY
        .OnAction = "modApp.Navigate ""Projects"""
    End With
    
    ' Project title
    Dim titleShape As Shape
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP + 40, 600, 30)
    With titleShape
        .TextFrame2.TextRange.Text = project(2)
        .TextFrame2.TextRange.Font.Size = 20
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Project details card
    Call RenderProjectDetailsCard(ws, CONTENT_LEFT, CONTENT_TOP + 80, project)
    
    ' Tasks section
    Dim tasks As Variant
    tasks = modData.GetTasksByProject(projectID)
    
    Call RenderProjectTasks(ws, CONTENT_LEFT, CONTENT_TOP + 250, projectID, tasks)
    
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error rendering project detail: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

Private Sub RenderProjectDetailsCard(ws As Worksheet, left As Double, top As Double, project As Variant)
    On Error Resume Next
    
    Dim card As Shape
    
    ' Card background
    Set card = ws.Shapes.AddShape(msoShapeRoundedRectangle, left, top, 950, 150)
    With card
        .Fill.ForeColor.RGB = COLOR_CARD_BG
        .Line.ForeColor.RGB = COLOR_CARD_BORDER
        .Line.Weight = 1
    End With
    
    ' Field labels and values
    Dim fieldTop As Double
    fieldTop = top + 15
    
    Call AddDetailField(ws, left + 20, fieldTop, "Status:", project(3))
    Call AddDetailField(ws, left + 250, fieldTop, "Risk Level:", project(7))
    Call AddDetailField(ws, left + 480, fieldTop, "% Complete:", project(8) & "%")
    
    fieldTop = fieldTop + 30
    Call AddDetailField(ws, left + 20, fieldTop, "Start Date:", Format(project(5), "mm/dd/yyyy"))
    Call AddDetailField(ws, left + 250, fieldTop, "Due Date:", Format(project(6), "mm/dd/yyyy"))
    
    fieldTop = fieldTop + 40
    
    ' Notes
    Dim notesLabel As Shape
    Set notesLabel = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 20, fieldTop, 100, 20)
    With notesLabel
        .TextFrame2.TextRange.Text = "Notes:"
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    Dim notesValue As Shape
    Set notesValue = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 20, fieldTop + 20, 900, 40)
    With notesValue
        .TextFrame2.TextRange.Text = IIf(IsEmpty(project(9)) Or project(9) = "", "No notes", project(9))
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .TextFrame2.WordWrap = msoTrue
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
End Sub

Private Sub AddDetailField(ws As Worksheet, left As Double, top As Double, label As String, value As Variant)
    On Error Resume Next
    
    Dim labelShape As Shape
    Dim valueShape As Shape
    
    Set labelShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left, top, 100, 20)
    With labelShape
        .TextFrame2.TextRange.Text = label
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    Set valueShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 105, top, 120, 20)
    With valueShape
        .TextFrame2.TextRange.Text = CStr(value)
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
End Sub

Private Sub RenderProjectTasks(ws As Worksheet, left As Double, top As Double, _
                               projectID As String, tasks As Variant)
    On Error Resume Next
    
    ' Section title
    Dim titleShape As Shape
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left, top, 400, 25)
    With titleShape
        .TextFrame2.TextRange.Text = "Tasks"
        .TextFrame2.TextRange.Font.Size = 16
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Add Task button
    Dim btnAddTask As Shape
    Set btnAddTask = ws.Shapes.AddShape(msoShapeRoundedRectangle, left + 850, top, 100, 25)
    With btnAddTask
        .TextFrame2.TextRange.Text = "Add Task"
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.ForeColor.RGB = COLOR_SUCCESS
        .Line.Visible = msoFalse
        .OnAction = "modUI.ShowNewTaskForm """ & projectID & """"
    End With
    
    ' Render tasks
    If Not IsEmpty(tasks) Then
        Dim i As Long
        Dim taskTop As Double
        taskTop = top + 40
        
        For i = 1 To UBound(tasks, 1)
            Call RenderTaskListItem(ws, left, taskTop, tasks(i, 1), tasks(i, 3), tasks(i, 4), tasks(i, 8))
            taskTop = taskTop + 35
            
            If i >= 10 Then Exit For
        Next i
    Else
        Dim noTasksShape As Shape
        Set noTasksShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left, top + 40, 600, 25)
        With noTasksShape
            .TextFrame2.TextRange.Text = "No tasks yet. Click 'Add Task' to create one."
            .TextFrame2.TextRange.Font.Size = 11
            .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
            .Fill.Visible = msoFalse
            .Line.Visible = msoFalse
        End With
    End If
    
End Sub

Private Sub RenderTaskListItem(ws As Worksheet, left As Double, top As Double, _
                               taskID As String, title As String, status As String, dueDate As Variant)
    On Error Resume Next
    
    Dim itemBg As Shape
    Dim titleShape As Shape
    Dim statusShape As Shape
    Dim dateShape As Shape
    
    ' Background
    Set itemBg = ws.Shapes.AddShape(msoShapeRectangle, left, top, 950, 30)
    With itemBg
        .Fill.ForeColor.RGB = RGB(248, 249, 250)
        .Line.Visible = msoFalse
    End With
    
    ' Task title
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 5, 500, 20)
    With titleShape
        .TextFrame2.TextRange.Text = title
        .TextFrame2.TextRange.Font.Size = 10
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Status
    Set statusShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 520, top + 5, 120, 20)
    With statusShape
        .TextFrame2.TextRange.Text = status
        .TextFrame2.TextRange.Font.Size = 9
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = GetStatusColor(status)
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Due date
    Dim dueDateText As String
    If IsEmpty(dueDate) Then
        dueDateText = "No due date"
    Else
        dueDateText = "Due: " & Format(dueDate, "mm/dd/yyyy")
    End If
    
    Set dateShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 650, top + 5, 150, 20)
    With dateShape
        .TextFrame2.TextRange.Text = dueDateText
        .TextFrame2.TextRange.Font.Size = 9
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
End Sub

' ============================================================================
' TASKS LIST VIEW
' ============================================================================

Public Sub RenderTasksList()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    Call ClearContentArea(ws)
    
    ' Section title
    Dim titleShape As Shape
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP, 400, 30)
    With titleShape
        .TextFrame2.TextRange.Text = "Tasks"
        .TextFrame2.TextRange.Font.Size = 20
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' New Task button
    Dim btnNew As Shape
    Set btnNew = ws.Shapes.AddShape(msoShapeRoundedRectangle, CONTENT_LEFT + 850, CONTENT_TOP, 120, 30)
    With btnNew
        .TextFrame2.TextRange.Text = "New Task"
        .TextFrame2.TextRange.Font.Size = 11
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.ForeColor.RGB = COLOR_SUCCESS
        .Line.Visible = msoFalse
        .OnAction = "modUI.ShowNewTaskForm"
    End With
    
    ' Get tasks data
    Dim tasks As Variant
    tasks = modData.GetAllTasks()
    
    ' Render tasks
    If Not IsEmpty(tasks) Then
        Dim i As Long
        Dim taskTop As Double
        taskTop = CONTENT_TOP + 50
        
        For i = 1 To UBound(tasks, 1)
            Call RenderTaskListItem(ws, CONTENT_LEFT, taskTop, tasks(i, 1), tasks(i, 3), tasks(i, 4), tasks(i, 8))
            taskTop = taskTop + 35
            
            If i >= 20 Then Exit For
        Next i
    Else
        Dim noDataShape As Shape
        Set noDataShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP + 60, 600, 30)
        With noDataShape
            .TextFrame2.TextRange.Text = "No tasks found. Click 'New Task' to create one."
            .TextFrame2.TextRange.Font.Size = 12
            .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
            .Fill.Visible = msoFalse
            .Line.Visible = msoFalse
        End With
    End If
    
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error rendering tasks list: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

' ============================================================================
' PEOPLE LIST VIEW
' ============================================================================

Public Sub RenderPeopleList()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    Call ClearContentArea(ws)
    
    ' Section title
    Dim titleShape As Shape
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP, 400, 30)
    With titleShape
        .TextFrame2.TextRange.Text = "People"
        .TextFrame2.TextRange.Font.Size = 20
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Placeholder message
    Dim msgShape As Shape
    Set msgShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP + 60, 600, 30)
    With msgShape
        .TextFrame2.TextRange.Text = "People management view - Coming soon"
        .TextFrame2.TextRange.Font.Size = 12
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error rendering people list: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

' ============================================================================
' REPORTS VIEW
' ============================================================================

Public Sub RenderReports()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    Call ClearContentArea(ws)
    
    ' Section title
    Dim titleShape As Shape
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP, 400, 30)
    With titleShape
        .TextFrame2.TextRange.Text = "Reports"
        .TextFrame2.TextRange.Font.Size = 20
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Placeholder message
    Dim msgShape As Shape
    Set msgShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP + 60, 600, 30)
    With msgShape
        .TextFrame2.TextRange.Text = "Reports and analytics view - Coming soon"
        .TextFrame2.TextRange.Font.Size = 12
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error rendering reports: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

' ============================================================================
' ADMIN VIEW
' ============================================================================

Public Sub RenderAdmin()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    Call ClearContentArea(ws)
    
    ' Section title
    Dim titleShape As Shape
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP, 400, 30)
    With titleShape
        .TextFrame2.TextRange.Text = "Admin / Settings"
        .TextFrame2.TextRange.Font.Size = 20
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_DARK
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    ' Placeholder message
    Dim msgShape As Shape
    Set msgShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, CONTENT_LEFT, CONTENT_TOP + 60, 600, 30)
    With msgShape
        .TextFrame2.TextRange.Text = "Admin and settings view - Coming soon"
        .TextFrame2.TextRange.Font.Size = 12
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = COLOR_TEXT_LIGHT
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
    Application.ScreenUpdating = True
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error rendering admin: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

' ============================================================================
' FORM DIALOGS
' ============================================================================

Public Sub ShowNewProjectForm()
    MsgBox "New Project form - To be implemented with UserForm", vbInformation, modApp.APP_NAME
End Sub

Public Sub ShowNewTaskForm(Optional projectID As String = "")
    MsgBox "New Task form - To be implemented with UserForm", vbInformation, modApp.APP_NAME
End Sub

' ============================================================================
' UTILITY FUNCTIONS
' ============================================================================

Private Sub ClearContentArea(ws As Worksheet)
    On Error Resume Next
    
    Dim shp As Shape
    
    ' Delete all shapes except navigation and header
    For Each shp In ws.Shapes
        If Left(shp.Name, 6) <> "btnNav" And _
           Left(shp.Name, 9) <> "shpHeader" Then
            shp.Delete
        End If
    Next shp
    
End Sub

Private Function GetUISheet() As Worksheet
    On Error Resume Next
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("UI_Main")
    
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add
        ws.Name = "UI_Main"
        ws.DisplayGridlines = False
        ws.DisplayHeadings = False
    End If
    
    Set GetUISheet = ws
    
End Function

Private Function GetStatusColor(status As String) As Long
    Select Case status
        Case "Active", "In Progress"
            GetStatusColor = COLOR_SUCCESS
        Case "Completed"
            GetStatusColor = COLOR_PRIMARY
        Case "On Hold", "Blocked"
            GetStatusColor = COLOR_WARNING
        Case "Cancelled"
            GetStatusColor = COLOR_DANGER
        Case Else
            GetStatusColor = COLOR_TEXT_LIGHT
    End Select
End Function

Private Function GetRiskColor(riskLevel As String) As Long
    Select Case riskLevel
        Case "Low"
            GetRiskColor = COLOR_SUCCESS
        Case "Medium"
            GetRiskColor = COLOR_WARNING
        Case "High", "Critical"
            GetRiskColor = COLOR_DANGER
        Case Else
            GetRiskColor = COLOR_TEXT_LIGHT
    End Select
End Function
