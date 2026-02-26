Attribute VB_Name = "modValidation"
Option Explicit

' ============================================================================
' modValidation - Data Validation Rules
' ============================================================================
' Provides validation functions for all data entities
' ============================================================================

' ============================================================================
' PROJECT VALIDATION
' ============================================================================

Public Function ValidateProjectData(projectName As String, ownerID As String, _
                                   startDate As Date, dueDate As Date) As Boolean
    On Error GoTo ErrorHandler
    
    ' Validate project name
    If Trim(projectName) = "" Then
        MsgBox "Project name is required.", vbExclamation, modApp.APP_NAME
        ValidateProjectData = False
        Exit Function
    End If
    
    If Len(projectName) > 255 Then
        MsgBox "Project name must be 255 characters or less.", vbExclamation, modApp.APP_NAME
        ValidateProjectData = False
        Exit Function
    End If
    
    ' Validate owner
    If Trim(ownerID) = "" Then
        MsgBox "Project owner is required.", vbExclamation, modApp.APP_NAME
        ValidateProjectData = False
        Exit Function
    End If
    
    ' Validate dates
    If dueDate < startDate Then
        MsgBox "Due date cannot be before start date.", vbExclamation, modApp.APP_NAME
        ValidateProjectData = False
        Exit Function
    End If
    
    ValidateProjectData = True
    Exit Function
    
ErrorHandler:
    MsgBox "Validation error: " & Err.Description, vbCritical, modApp.APP_NAME
    ValidateProjectData = False
End Function

' ============================================================================
' TASK VALIDATION
' ============================================================================

Public Function ValidateTaskData(title As String, projectID As String, _
                                assigneeID As String) As Boolean
    On Error GoTo ErrorHandler
    
    ' Validate title
    If Trim(title) = "" Then
        MsgBox "Task title is required.", vbExclamation, modApp.APP_NAME
        ValidateTaskData = False
        Exit Function
    End If
    
    If Len(title) > 255 Then
        MsgBox "Task title must be 255 characters or less.", vbExclamation, modApp.APP_NAME
        ValidateTaskData = False
        Exit Function
    End If
    
    ' Validate project ID
    If Trim(projectID) = "" Then
        MsgBox "Project is required for task.", vbExclamation, modApp.APP_NAME
        ValidateTaskData = False
        Exit Function
    End If
    
    ' Validate assignee
    If Trim(assigneeID) = "" Then
        MsgBox "Task assignee is required.", vbExclamation, modApp.APP_NAME
        ValidateTaskData = False
        Exit Function
    End If
    
    ValidateTaskData = True
    Exit Function
    
ErrorHandler:
    MsgBox "Validation error: " & Err.Description, vbCritical, modApp.APP_NAME
    ValidateTaskData = False
End Function

' ============================================================================
' PERSON VALIDATION
' ============================================================================

Public Function ValidatePersonData(displayName As String, email As String, _
                                  role As String) As Boolean
    On Error GoTo ErrorHandler
    
    ' Validate display name
    If Trim(displayName) = "" Then
        MsgBox "Display name is required.", vbExclamation, modApp.APP_NAME
        ValidatePersonData = False
        Exit Function
    End If
    
    ' Validate email format (basic check)
    If Trim(email) <> "" Then
        If InStr(email, "@") = 0 Or InStr(email, ".") = 0 Then
            MsgBox "Invalid email format.", vbExclamation, modApp.APP_NAME
            ValidatePersonData = False
            Exit Function
        End If
    End If
    
    ' Validate role
    If Trim(role) = "" Then
        MsgBox "Role is required.", vbExclamation, modApp.APP_NAME
        ValidatePersonData = False
        Exit Function
    End If
    
    ValidatePersonData = True
    Exit Function
    
ErrorHandler:
    MsgBox "Validation error: " & Err.Description, vbCritical, modApp.APP_NAME
    ValidatePersonData = False
End Function

' ============================================================================
' FIELD VALIDATION HELPERS
' ============================================================================

Public Function IsValidDate(dateValue As Variant) As Boolean
    On Error Resume Next
    IsValidDate = IsDate(dateValue)
End Function

Public Function IsValidNumber(numValue As Variant) As Boolean
    On Error Resume Next
    IsValidNumber = IsNumeric(numValue)
End Function

Public Function IsValidPercentage(value As Variant) As Boolean
    On Error Resume Next
    
    If Not IsNumeric(value) Then
        IsValidPercentage = False
        Exit Function
    End If
    
    Dim numValue As Long
    numValue = CLng(value)
    
    IsValidPercentage = (numValue >= 0 And numValue <= 100)
End Function

Public Function IsValidEmail(email As String) As Boolean
    On Error Resume Next
    
    If Trim(email) = "" Then
        IsValidEmail = False
        Exit Function
    End If
    
    ' Basic email validation
    IsValidEmail = (InStr(email, "@") > 0 And InStr(email, ".") > 0)
End Function
