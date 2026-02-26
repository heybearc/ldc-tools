# ============================================================================
# Test SharePoint Connection
# ============================================================================
# This script tests if you can connect to your SharePoint tenant
# Run this first to see if PowerShell deployment is possible
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SharePoint Connection Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check if PnP PowerShell is installed
Write-Host "Step 1: Checking for PnP PowerShell module..." -ForegroundColor Yellow

$pnpModule = Get-Module -ListAvailable -Name "PnP.PowerShell"

if ($pnpModule) {
    Write-Host "  ✓ PnP.PowerShell is installed (Version: $($pnpModule.Version))" -ForegroundColor Green
} else {
    Write-Host "  ✗ PnP.PowerShell is NOT installed" -ForegroundColor Red
    Write-Host "`nAttempting to install PnP.PowerShell..." -ForegroundColor Yellow
    
    try {
        Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force -AllowClobber
        Write-Host "  ✓ PnP.PowerShell installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to install PnP.PowerShell" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`nYou may need to install manually or use the manual deployment method." -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Get SharePoint site URL from user
Write-Host "`nStep 2: Enter your SharePoint site URL" -ForegroundColor Yellow
Write-Host "  Example: https://yourtenant.sharepoint.com/sites/YourSite" -ForegroundColor Gray

$siteUrl = Read-Host "  SharePoint Site URL"

if ([string]::IsNullOrWhiteSpace($siteUrl)) {
    Write-Host "  ✗ No URL provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "  Site URL: $siteUrl" -ForegroundColor Gray

# Step 3: Attempt connection
Write-Host "`nStep 3: Attempting to connect to SharePoint..." -ForegroundColor Yellow
Write-Host "  A browser window will open for authentication..." -ForegroundColor Gray

try {
    Connect-PnPOnline -Url $siteUrl -Interactive
    Write-Host "  ✓ Successfully connected to SharePoint!" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to connect to SharePoint" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPossible issues:" -ForegroundColor Yellow
    Write-Host "  - Incorrect site URL" -ForegroundColor Gray
    Write-Host "  - No permissions to the site" -ForegroundColor Gray
    Write-Host "  - Network/firewall restrictions" -ForegroundColor Gray
    Write-Host "  - MFA or conditional access policies blocking" -ForegroundColor Gray
    Write-Host "`nYou'll need to use the manual deployment method." -ForegroundColor Yellow
    exit 1
}

# Step 4: Test permissions
Write-Host "`nStep 4: Testing permissions..." -ForegroundColor Yellow

try {
    # Try to get site information
    $web = Get-PnPWeb
    Write-Host "  ✓ Can read site information" -ForegroundColor Green
    Write-Host "    Site Title: $($web.Title)" -ForegroundColor Gray
    Write-Host "    Site URL: $($web.Url)" -ForegroundColor Gray
    
    # Try to get lists
    $lists = Get-PnPList
    Write-Host "  ✓ Can read lists ($($lists.Count) lists found)" -ForegroundColor Green
    
    # Check if we can create a test list
    Write-Host "`n  Testing list creation permissions..." -ForegroundColor Gray
    
    $testListName = "PnP_Test_$(Get-Date -Format 'yyyyMMddHHmmss')"
    
    try {
        $testList = New-PnPList -Title $testListName -Template GenericList -ErrorAction Stop
        Write-Host "  ✓ Can create lists!" -ForegroundColor Green
        
        # Clean up test list
        Remove-PnPList -Identity $testListName -Force
        Write-Host "  ✓ Test list cleaned up" -ForegroundColor Green
        
    } catch {
        Write-Host "  ✗ Cannot create lists" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n  You may have read-only access. You'll need:" -ForegroundColor Yellow
        Write-Host "    - Contribute permissions or higher" -ForegroundColor Gray
        Write-Host "    - Site Owner/Member role" -ForegroundColor Gray
        Write-Host "`n  Contact your site administrator or use manual deployment." -ForegroundColor Yellow
        
        Disconnect-PnPOnline
        exit 1
    }
    
} catch {
    Write-Host "  ✗ Permission test failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    Disconnect-PnPOnline
    exit 1
}

# Step 5: Check for existing LDC lists
Write-Host "`nStep 5: Checking for existing LDC Tools lists..." -ForegroundColor Yellow

$ldcLists = @("LDC_Projects", "LDC_Tasks", "LDC_Feedback", "LDC_Settings")
$existingLists = @()

foreach ($listName in $ldcLists) {
    $list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
    if ($list) {
        $existingLists += $listName
        Write-Host "  ! List '$listName' already exists" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ List '$listName' does not exist (ready to create)" -ForegroundColor Green
    }
}

if ($existingLists.Count -gt 0) {
    Write-Host "`n  WARNING: Some lists already exist:" -ForegroundColor Yellow
    foreach ($existing in $existingLists) {
        Write-Host "    - $existing" -ForegroundColor Gray
    }
    Write-Host "`n  The creation script will skip existing lists." -ForegroundColor Gray
}

# Success summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Connection Test: SUCCESS!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✓ PnP PowerShell is installed and working" -ForegroundColor Green
Write-Host "  ✓ Connected to SharePoint site" -ForegroundColor Green
Write-Host "  ✓ Have permissions to create lists" -ForegroundColor Green
Write-Host "  ✓ Ready to run the deployment script`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the list schemas in sharepoint-lists/ folder" -ForegroundColor White
Write-Host "  2. Edit Create-SharePoint-Lists.ps1 and set your site URL (line 12)" -ForegroundColor White
Write-Host "  3. Run: .\Create-SharePoint-Lists.ps1" -ForegroundColor White
Write-Host "  4. Build the Power Apps application`n" -ForegroundColor White

# Disconnect
Disconnect-PnPOnline

Write-Host "Disconnected from SharePoint.`n" -ForegroundColor Gray
