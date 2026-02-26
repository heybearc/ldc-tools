Attribute VB_Name = "modUtils"
Option Explicit

' ============================================================================
' modUtils - Utility Functions
' ============================================================================
' Provides utility functions for ID generation, date formatting, etc.
' ============================================================================

' ============================================================================
' ID GENERATION
' ============================================================================

Public Function GenerateID(prefix As String) As String
    On Error Resume Next
    
    ' Generate a unique ID using timestamp and random number
    Dim timestamp As String
    Dim randomPart As String
    
    timestamp = Format(Now, "yyyymmddhhnnss")
    randomPart = Format(Int(Rnd * 10000), "0000")
    
    GenerateID = prefix & "-" & timestamp & "-" & randomPart
End Function

Public Function GenerateGUID() As String
    On Error Resume Next
    
    ' Simple GUID-like generation (not cryptographically secure)
    Dim i As Integer
    Dim guid As String
    
    Randomize
    
    guid = ""
    For i = 1 To 32
        If i = 9 Or i = 13 Or i = 17 Or i = 21 Then
            guid = guid & "-"
        End If
        guid = guid & Hex(Int(Rnd * 16))
    Next i
    
    GenerateGUID = guid
End Function

' ============================================================================
' DATE FORMATTING
' ============================================================================

Public Function FormatDateShort(dateValue As Variant) As String
    On Error Resume Next
    
    If IsEmpty(dateValue) Or Not IsDate(dateValue) Then
        FormatDateShort = ""
    Else
        FormatDateShort = Format(dateValue, "mm/dd/yyyy")
    End If
End Function

Public Function FormatDateLong(dateValue As Variant) As String
    On Error Resume Next
    
    If IsEmpty(dateValue) Or Not IsDate(dateValue) Then
        FormatDateLong = ""
    Else
        FormatDateLong = Format(dateValue, "mmmm dd, yyyy")
    End If
End Function

Public Function FormatDateTime(dateValue As Variant) As String
    On Error Resume Next
    
    If IsEmpty(dateValue) Or Not IsDate(dateValue) Then
        FormatDateTime = ""
    Else
        FormatDateTime = Format(dateValue, "mm/dd/yyyy hh:nn AM/PM")
    End If
End Function

Public Function GetDaysDifference(startDate As Date, endDate As Date) As Long
    On Error Resume Next
    GetDaysDifference = DateDiff("d", startDate, endDate)
End Function

Public Function IsOverdue(dueDate As Variant) As Boolean
    On Error Resume Next
    
    If IsEmpty(dueDate) Or Not IsDate(dueDate) Then
        IsOverdue = False
    Else
        IsOverdue = (CDate(dueDate) < Date)
    End If
End Function

Public Function IsDueSoon(dueDate As Variant, Optional daysThreshold As Long = 7) As Boolean
    On Error Resume Next
    
    If IsEmpty(dueDate) Or Not IsDate(dueDate) Then
        IsDueSoon = False
    Else
        Dim daysDiff As Long
        daysDiff = DateDiff("d", Date, CDate(dueDate))
        IsDueSoon = (daysDiff >= 0 And daysDiff <= daysThreshold)
    End If
End Function

' ============================================================================
' STRING UTILITIES
' ============================================================================

Public Function TruncateString(text As String, maxLength As Long, _
                              Optional addEllipsis As Boolean = True) As String
    On Error Resume Next
    
    If Len(text) <= maxLength Then
        TruncateString = text
    Else
        If addEllipsis Then
            TruncateString = Left(text, maxLength - 3) & "..."
        Else
            TruncateString = Left(text, maxLength)
        End If
    End If
End Function

Public Function CleanString(text As String) As String
    On Error Resume Next
    
    ' Remove leading/trailing spaces and extra internal spaces
    Dim result As String
    result = Trim(text)
    
    ' Replace multiple spaces with single space
    Do While InStr(result, "  ") > 0
        result = Replace(result, "  ", " ")
    Loop
    
    CleanString = result
End Function

Public Function IsNullOrEmpty(text As Variant) As Boolean
    On Error Resume Next
    
    If IsNull(text) Or IsEmpty(text) Then
        IsNullOrEmpty = True
    ElseIf VarType(text) = vbString Then
        IsNullOrEmpty = (Trim(text) = "")
    Else
        IsNullOrEmpty = False
    End If
End Function

' ============================================================================
' NUMBER UTILITIES
' ============================================================================

Public Function SafeDivide(numerator As Double, denominator As Double, _
                          Optional defaultValue As Double = 0) As Double
    On Error Resume Next
    
    If denominator = 0 Then
        SafeDivide = defaultValue
    Else
        SafeDivide = numerator / denominator
    End If
End Function

Public Function PercentageToDecimal(percentage As Double) As Double
    On Error Resume Next
    PercentageToDecimal = percentage / 100
End Function

Public Function DecimalToPercentage(decimal As Double) As Double
    On Error Resume Next
    DecimalToPercentage = decimal * 100
End Function

' ============================================================================
' ARRAY UTILITIES
' ============================================================================

Public Function ArrayContains(arr As Variant, value As Variant) As Boolean
    On Error Resume Next
    
    Dim i As Long
    ArrayContains = False
    
    For i = LBound(arr) To UBound(arr)
        If arr(i) = value Then
            ArrayContains = True
            Exit Function
        End If
    Next i
End Function

Public Function ArrayToString(arr As Variant, Optional delimiter As String = ", ") As String
    On Error Resume Next
    
    Dim i As Long
    Dim result As String
    
    result = ""
    For i = LBound(arr) To UBound(arr)
        If i > LBound(arr) Then result = result & delimiter
        result = result & CStr(arr(i))
    Next i
    
    ArrayToString = result
End Function

' ============================================================================
' COLOR UTILITIES
' ============================================================================

Public Function RGB2Long(r As Long, g As Long, b As Long) As Long
    RGB2Long = RGB(r, g, b)
End Function

Public Function GetStatusColor(status As String) As Long
    Select Case LCase(status)
        Case "active", "in progress", "completed"
            GetStatusColor = RGB(40, 167, 69)  ' Green
        Case "on hold", "blocked"
            GetStatusColor = RGB(255, 193, 7)  ' Yellow
        Case "cancelled"
            GetStatusColor = RGB(220, 53, 69)  ' Red
        Case Else
            GetStatusColor = RGB(108, 117, 125) ' Gray
    End Select
End Function

Public Function GetRiskColor(riskLevel As String) As Long
    Select Case LCase(riskLevel)
        Case "low"
            GetRiskColor = RGB(40, 167, 69)    ' Green
        Case "medium"
            GetRiskColor = RGB(255, 193, 7)    ' Yellow
        Case "high"
            GetRiskColor = RGB(253, 126, 20)   ' Orange
        Case "critical"
            GetRiskColor = RGB(220, 53, 69)    ' Red
        Case Else
            GetRiskColor = RGB(108, 117, 125)  ' Gray
    End Select
End Function

' ============================================================================
' FILE UTILITIES
' ============================================================================

Public Function GetWorkbookPath() As String
    On Error Resume Next
    GetWorkbookPath = ThisWorkbook.Path
End Function

Public Function GetWorkbookName() As String
    On Error Resume Next
    GetWorkbookName = ThisWorkbook.Name
End Function

Public Function GetWorkbookFullPath() As String
    On Error Resume Next
    GetWorkbookFullPath = ThisWorkbook.FullName
End Function

' ============================================================================
' EXCEL UTILITIES
' ============================================================================

Public Sub DisableScreenUpdating()
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    Application.Calculation = xlCalculationManual
End Sub

Public Sub EnableScreenUpdating()
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    Application.Calculation = xlCalculationAutomatic
End Sub

Public Function SheetExists(sheetName As String) As Boolean
    On Error Resume Next
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(sheetName)
    
    SheetExists = Not (ws Is Nothing)
End Function

Public Function TableExists(tableName As String) As Boolean
    On Error Resume Next
    
    Dim ws As Worksheet
    Dim tbl As ListObject
    
    For Each ws In ThisWorkbook.Worksheets
        For Each tbl In ws.ListObjects
            If tbl.Name = tableName Then
                TableExists = True
                Exit Function
            End If
        Next tbl
    Next ws
    
    TableExists = False
End Function

' ============================================================================
' DEBUGGING UTILITIES
' ============================================================================

Public Sub DebugPrint(message As String)
    Debug.Print Format(Now, "hh:nn:ss") & " - " & message
End Sub

Public Sub LogError(functionName As String, errorDescription As String)
    Debug.Print "ERROR in " & functionName & ": " & errorDescription
End Sub
