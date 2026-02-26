Attribute VB_Name = "modApp"
Option Explicit

' ============================================================================
' modApp - Application Bootstrap and Routing
' ============================================================================
' This module handles application initialization, global state, and routing
' between different views.
' ============================================================================

' Global state variables
Public g_CurrentView As String
Public g_CurrentProjectID As String
Public g_CurrentFilter As String
Public g_IsInitialized As Boolean

' Application constants
Public Const APP_NAME As String = "LDC Tools v2"
Public Const APP_VERSION As String = "2.0.0"

' ============================================================================
' INITIALIZATION
' ============================================================================

Public Sub InitializeApp()
    On Error GoTo ErrorHandler
    
    ' Prevent screen flicker during initialization
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    
    ' Initialize global state
    g_CurrentView = "Dashboard"
    g_CurrentProjectID = ""
    g_CurrentFilter = ""
    g_IsInitialized = False
    
    ' Ensure data tables exist
    Call modData.InitializeDataTables
    
    ' Set up the UI shell
    Call modNav.InitializeNavigation
    
    ' Navigate to dashboard
    Call Navigate("Dashboard")
    
    ' Mark as initialized
    g_IsInitialized = True
    
    ' Re-enable screen updating
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    MsgBox "Error initializing application: " & Err.Description, vbCritical, APP_NAME
End Sub

' ============================================================================
' ROUTING
' ============================================================================

Public Sub Navigate(viewName As String, Optional args As Variant)
    On Error GoTo ErrorHandler
    
    ' Validate view name
    If Not IsValidView(viewName) Then
        MsgBox "Invalid view: " & viewName, vbExclamation, APP_NAME
        Exit Sub
    End If
    
    ' Update current view
    g_CurrentView = viewName
    
    ' Update navigation highlighting
    Call modNav.HighlightActiveView(viewName)
    
    ' Route to appropriate view renderer
    Application.ScreenUpdating = False
    
    Select Case viewName
        Case "Dashboard"
            Call modUI.RenderDashboard
            
        Case "Projects"
            Call modUI.RenderProjectsList
            
        Case "ProjectDetail"
            If Not IsMissing(args) Then
                g_CurrentProjectID = CStr(args)
                Call modUI.RenderProjectDetail(g_CurrentProjectID)
            Else
                MsgBox "Project ID required for Project Detail view", vbExclamation, APP_NAME
                Call Navigate("Projects")
            End If
            
        Case "Tasks"
            Call modUI.RenderTasksList
            
        Case "People"
            Call modUI.RenderPeopleList
            
        Case "Reports"
            Call modUI.RenderReports
            
        Case "Admin"
            Call modUI.RenderAdmin
            
        Case Else
            MsgBox "View not implemented: " & viewName, vbInformation, APP_NAME
            
    End Select
    
    Application.ScreenUpdating = True
    
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error navigating to " & viewName & ": " & Err.Description, vbCritical, APP_NAME
End Sub

' ============================================================================
' VALIDATION
' ============================================================================

Private Function IsValidView(viewName As String) As Boolean
    Dim validViews As Variant
    validViews = Array("Dashboard", "Projects", "ProjectDetail", "Tasks", "People", "Reports", "Admin")
    
    Dim i As Long
    For i = LBound(validViews) To UBound(validViews)
        If validViews(i) = viewName Then
            IsValidView = True
            Exit Function
        End If
    Next i
    
    IsValidView = False
End Function

' ============================================================================
' UTILITY FUNCTIONS
' ============================================================================

Public Function GetCurrentView() As String
    GetCurrentView = g_CurrentView
End Function

Public Function GetCurrentProjectID() As String
    GetCurrentProjectID = g_CurrentProjectID
End Function

Public Sub SetCurrentFilter(filterValue As String)
    g_CurrentFilter = filterValue
End Sub

Public Function GetCurrentFilter() As String
    GetCurrentFilter = g_CurrentFilter
End Function

' ============================================================================
' APPLICATION ACTIONS
' ============================================================================

Public Sub RefreshCurrentView()
    On Error Resume Next
    Call Navigate(g_CurrentView, g_CurrentProjectID)
End Sub

Public Sub ShowAbout()
    Dim msg As String
    msg = APP_NAME & vbCrLf & _
          "Version " & APP_VERSION & vbCrLf & vbCrLf & _
          "A self-contained construction management tool" & vbCrLf & _
          "built entirely in Excel with VBA." & vbCrLf & vbCrLf & _
          "No internet required. No external dependencies."
    
    MsgBox msg, vbInformation, "About " & APP_NAME
End Sub
