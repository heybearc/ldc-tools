Attribute VB_Name = "modNav"
Option Explicit

' ============================================================================
' modNav - Navigation Management
' ============================================================================
' Handles the navigation panel, view switching, and UI shell components
' ============================================================================

' Navigation button names (shapes)
Private Const NAV_BTN_DASHBOARD As String = "btnNavDashboard"
Private Const NAV_BTN_PROJECTS As String = "btnNavProjects"
Private Const NAV_BTN_TASKS As String = "btnNavTasks"
Private Const NAV_BTN_PEOPLE As String = "btnNavPeople"
Private Const NAV_BTN_REPORTS As String = "btnNavReports"
Private Const NAV_BTN_ADMIN As String = "btnNavAdmin"

' Color scheme
Private Const COLOR_NAV_ACTIVE As Long = 5296274      ' Blue
Private Const COLOR_NAV_INACTIVE As Long = 15132390   ' Light gray
Private Const COLOR_NAV_HOVER As Long = 12632256      ' Light blue

' ============================================================================
' INITIALIZATION
' ============================================================================

Public Sub InitializeNavigation()
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    ' Create navigation panel if it doesn't exist
    Call CreateNavigationPanel(ws)
    
    ' Create header bar
    Call CreateHeaderBar(ws)
    
    ' Highlight dashboard as default
    Call HighlightActiveView("Dashboard")
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error initializing navigation: " & Err.Description, vbCritical, modApp.APP_NAME
End Sub

' ============================================================================
' NAVIGATION PANEL CREATION
' ============================================================================

Private Sub CreateNavigationPanel(ws As Worksheet)
    On Error Resume Next
    
    Dim navPanel As Shape
    Dim btnTop As Double
    Dim btnLeft As Double
    Dim btnWidth As Double
    Dim btnHeight As Double
    Dim btnSpacing As Double
    
    ' Panel dimensions
    btnLeft = 10
    btnTop = 80
    btnWidth = 120
    btnHeight = 35
    btnSpacing = 5
    
    ' Create navigation buttons
    Call CreateNavButton(ws, NAV_BTN_DASHBOARD, "Dashboard", btnLeft, btnTop, btnWidth, btnHeight, "modApp.Navigate ""Dashboard""")
    btnTop = btnTop + btnHeight + btnSpacing
    
    Call CreateNavButton(ws, NAV_BTN_PROJECTS, "Projects", btnLeft, btnTop, btnWidth, btnHeight, "modApp.Navigate ""Projects""")
    btnTop = btnTop + btnHeight + btnSpacing
    
    Call CreateNavButton(ws, NAV_BTN_TASKS, "Tasks", btnLeft, btnTop, btnWidth, btnHeight, "modApp.Navigate ""Tasks""")
    btnTop = btnTop + btnHeight + btnSpacing
    
    Call CreateNavButton(ws, NAV_BTN_PEOPLE, "People", btnLeft, btnTop, btnWidth, btnHeight, "modApp.Navigate ""People""")
    btnTop = btnTop + btnHeight + btnSpacing
    
    Call CreateNavButton(ws, NAV_BTN_REPORTS, "Reports", btnLeft, btnTop, btnWidth, btnHeight, "modApp.Navigate ""Reports""")
    btnTop = btnTop + btnHeight + btnSpacing
    
    Call CreateNavButton(ws, NAV_BTN_ADMIN, "Admin / Settings", btnLeft, btnTop, btnWidth, btnHeight, "modApp.Navigate ""Admin""")
    
End Sub

Private Sub CreateNavButton(ws As Worksheet, btnName As String, btnText As String, _
                            left As Double, top As Double, width As Double, height As Double, _
                            macroName As String)
    On Error Resume Next
    
    Dim btn As Shape
    
    ' Delete existing button if present
    ws.Shapes(btnName).Delete
    
    ' Create new button
    Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, left, top, width, height)
    
    With btn
        .Name = btnName
        .TextFrame2.TextRange.Text = btnText
        .TextFrame2.TextRange.Font.Size = 11
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
        .Fill.ForeColor.RGB = COLOR_NAV_INACTIVE
        .Line.Visible = msoFalse
        .OnAction = macroName
    End With
    
End Sub

' ============================================================================
' HEADER BAR CREATION
' ============================================================================

Private Sub CreateHeaderBar(ws As Worksheet)
    On Error Resume Next
    
    Dim headerBar As Shape
    Dim titleShape As Shape
    
    ' Delete existing header if present
    ws.Shapes("shpHeaderBar").Delete
    ws.Shapes("shpHeaderTitle").Delete
    
    ' Create header bar background
    Set headerBar = ws.Shapes.AddShape(msoShapeRectangle, 0, 0, 1200, 60)
    With headerBar
        .Name = "shpHeaderBar"
        .Fill.ForeColor.RGB = RGB(41, 98, 255)
        .Line.Visible = msoFalse
    End With
    
    ' Create title text
    Set titleShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, 150, 15, 400, 30)
    With titleShape
        .Name = "shpHeaderTitle"
        .TextFrame2.TextRange.Text = modApp.APP_NAME
        .TextFrame2.TextRange.Font.Size = 18
        .TextFrame2.TextRange.Font.Bold = msoTrue
        .TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextFrame2.VerticalAnchor = msoAnchorMiddle
        .Fill.Visible = msoFalse
        .Line.Visible = msoFalse
    End With
    
End Sub

' ============================================================================
' ACTIVE VIEW HIGHLIGHTING
' ============================================================================

Public Sub HighlightActiveView(viewName As String)
    On Error Resume Next
    
    Dim ws As Worksheet
    Set ws = GetUISheet()
    
    ' Reset all buttons to inactive color
    ws.Shapes(NAV_BTN_DASHBOARD).Fill.ForeColor.RGB = COLOR_NAV_INACTIVE
    ws.Shapes(NAV_BTN_PROJECTS).Fill.ForeColor.RGB = COLOR_NAV_INACTIVE
    ws.Shapes(NAV_BTN_TASKS).Fill.ForeColor.RGB = COLOR_NAV_INACTIVE
    ws.Shapes(NAV_BTN_PEOPLE).Fill.ForeColor.RGB = COLOR_NAV_INACTIVE
    ws.Shapes(NAV_BTN_REPORTS).Fill.ForeColor.RGB = COLOR_NAV_INACTIVE
    ws.Shapes(NAV_BTN_ADMIN).Fill.ForeColor.RGB = COLOR_NAV_INACTIVE
    
    ' Highlight active button
    Select Case viewName
        Case "Dashboard"
            ws.Shapes(NAV_BTN_DASHBOARD).Fill.ForeColor.RGB = COLOR_NAV_ACTIVE
        Case "Projects", "ProjectDetail"
            ws.Shapes(NAV_BTN_PROJECTS).Fill.ForeColor.RGB = COLOR_NAV_ACTIVE
        Case "Tasks"
            ws.Shapes(NAV_BTN_TASKS).Fill.ForeColor.RGB = COLOR_NAV_ACTIVE
        Case "People"
            ws.Shapes(NAV_BTN_PEOPLE).Fill.ForeColor.RGB = COLOR_NAV_ACTIVE
        Case "Reports"
            ws.Shapes(NAV_BTN_REPORTS).Fill.ForeColor.RGB = COLOR_NAV_ACTIVE
        Case "Admin"
            ws.Shapes(NAV_BTN_ADMIN).Fill.ForeColor.RGB = COLOR_NAV_ACTIVE
    End Select
    
    ' Update header title
    Call UpdateHeaderTitle(viewName)
    
End Sub

Private Sub UpdateHeaderTitle(viewName As String)
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim titleText As String
    
    Set ws = GetUISheet()
    
    Select Case viewName
        Case "Dashboard"
            titleText = modApp.APP_NAME & " - Dashboard"
        Case "Projects"
            titleText = modApp.APP_NAME & " - Projects"
        Case "ProjectDetail"
            titleText = modApp.APP_NAME & " - Project Detail"
        Case "Tasks"
            titleText = modApp.APP_NAME & " - Tasks"
        Case "People"
            titleText = modApp.APP_NAME & " - People"
        Case "Reports"
            titleText = modApp.APP_NAME & " - Reports"
        Case "Admin"
            titleText = modApp.APP_NAME & " - Admin / Settings"
        Case Else
            titleText = modApp.APP_NAME
    End Select
    
    ws.Shapes("shpHeaderTitle").TextFrame2.TextRange.Text = titleText
    
End Sub

' ============================================================================
' UTILITY FUNCTIONS
' ============================================================================

Private Function GetUISheet() As Worksheet
    On Error Resume Next
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("UI_Main")
    
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add
        ws.Name = "UI_Main"
        
        ' Configure sheet appearance
        With ws
            .DisplayGridlines = False
            .DisplayHeadings = False
            .Tab.Color = RGB(41, 98, 255)
        End With
    End If
    
    Set GetUISheet = ws
    
End Function
