VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Option Explicit

' ============================================================================
' ThisWorkbook - Workbook Event Handlers
' ============================================================================
' Handles workbook-level events like Open, BeforeClose, etc.
' ============================================================================

Private Sub Workbook_Open()
    On Error GoTo ErrorHandler
    
    ' Initialize the application when workbook opens
    Call modApp.InitializeApp
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error opening workbook: " & Err.Description, vbCritical, "LDC Tools v2"
End Sub

Private Sub Workbook_BeforeClose(Cancel As Boolean)
    On Error Resume Next
    
    ' Cleanup or save state if needed
    ' Currently no cleanup required
    
End Sub

Private Sub Workbook_BeforeSave(ByVal SaveAsUI As Boolean, Cancel As Boolean)
    On Error Resume Next
    
    ' Optional: Add pre-save validation or cleanup
    
End Sub

Private Sub Workbook_SheetActivate(ByVal Sh As Object)
    On Error Resume Next
    
    ' Prevent users from navigating to hidden data sheets
    If Sh.Name Like "Data_*" Then
        ' Redirect to UI sheet
        ThisWorkbook.Worksheets("UI_Main").Activate
        MsgBox "Data sheets are protected. Please use the application interface.", _
               vbInformation, "LDC Tools v2"
    End If
    
End Sub
