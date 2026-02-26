# ============================================================================
# Create SharePoint Lists for LDC Tools Power Apps
# ============================================================================
# This script creates all required SharePoint lists for the LDC Tools app
# Run this in SharePoint Online Management Shell or PnP PowerShell
# ============================================================================

# Prerequisites:
# Install-Module -Name PnP.PowerShell -Scope CurrentUser

# CONFIGURATION - UPDATE THESE VALUES
$SiteUrl = "https://yourtenant.sharepoint.com/sites/YourSite"
$ListsFolder = "../sharepoint-lists"

# Connect to SharePoint
Write-Host "Connecting to SharePoint site: $SiteUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive

# ============================================================================
# FUNCTION: Create List from Schema
# ============================================================================
function Create-ListFromSchema {
    param(
        [string]$SchemaFile
    )
    
    Write-Host "`nProcessing schema: $SchemaFile" -ForegroundColor Yellow
    
    $schema = Get-Content $SchemaFile | ConvertFrom-Json
    $listName = $schema.listName
    
    # Check if list already exists
    $existingList = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
    
    if ($existingList) {
        Write-Host "  List '$listName' already exists. Skipping..." -ForegroundColor Gray
        return
    }
    
    # Create the list
    Write-Host "  Creating list: $listName" -ForegroundColor Green
    $list = New-PnPList -Title $listName -Template GenericList -OnQuickLaunch
    
    # Enable versioning if specified
    if ($schema.enableVersioning) {
        Set-PnPList -Identity $listName -EnableVersioning $true
    }
    
    # Add custom fields
    Write-Host "  Adding custom fields..." -ForegroundColor Green
    
    foreach ($field in $schema.fields) {
        # Skip Title field as it's built-in
        if ($field.internalName -eq "Title") {
            # Update Title field display name if different
            if ($field.displayName -ne "Title") {
                $titleField = Get-PnPField -List $listName -Identity "Title"
                Set-PnPField -List $listName -Identity "Title" -Values @{Title=$field.displayName}
            }
            continue
        }
        
        Write-Host "    - $($field.displayName) ($($field.type))" -ForegroundColor Gray
        
        switch ($field.type) {
            "Text" {
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type Text `
                    -Required:$field.required
            }
            "Note" {
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type Note `
                    -Required:$field.required
            }
            "Choice" {
                $choices = $field.choices -join "|"
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type Choice `
                    -Choices $field.choices -Required:$field.required
                
                if ($field.defaultValue) {
                    Set-PnPField -List $listName -Identity $field.internalName `
                        -Values @{DefaultValue=$field.defaultValue}
                }
            }
            "Number" {
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type Number `
                    -Required:$field.required
            }
            "Currency" {
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type Currency `
                    -Required:$field.required
            }
            "DateTime" {
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type DateTime `
                    -Required:$field.required -DisplayFormat $field.format
            }
            "Boolean" {
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type Boolean `
                    -Required:$field.required
                
                if ($field.defaultValue) {
                    Set-PnPField -List $listName -Identity $field.internalName `
                        -Values @{DefaultValue=$field.defaultValue}
                }
            }
            "User" {
                Add-PnPField -List $listName -DisplayName $field.displayName `
                    -InternalName $field.internalName -Type User `
                    -Required:$field.required
            }
            "Lookup" {
                # Lookup fields need to be created after all lists exist
                # We'll handle these in a second pass
                Write-Host "      (Lookup field - will be created in second pass)" -ForegroundColor DarkGray
            }
        }
    }
    
    Write-Host "  List '$listName' created successfully!" -ForegroundColor Green
}

# ============================================================================
# FUNCTION: Create Lookup Fields
# ============================================================================
function Create-LookupFields {
    param(
        [string]$SchemaFile
    )
    
    $schema = Get-Content $SchemaFile | ConvertFrom-Json
    $listName = $schema.listName
    
    $lookupFields = $schema.fields | Where-Object { $_.type -eq "Lookup" }
    
    if ($lookupFields.Count -eq 0) {
        return
    }
    
    Write-Host "`nCreating lookup fields for: $listName" -ForegroundColor Yellow
    
    foreach ($field in $lookupFields) {
        Write-Host "  - $($field.displayName) -> $($field.lookupList)" -ForegroundColor Gray
        
        # Get the lookup list
        $lookupList = Get-PnPList -Identity $field.lookupList -ErrorAction SilentlyContinue
        
        if (-not $lookupList) {
            Write-Host "    WARNING: Lookup list '$($field.lookupList)' not found. Skipping..." -ForegroundColor Red
            continue
        }
        
        # Create lookup field
        Add-PnPField -List $listName -DisplayName $field.displayName `
            -InternalName $field.internalName -Type Lookup `
            -Required:$field.required `
            -AddToDefaultView `
            -LookupList $field.lookupList `
            -LookupField $field.lookupField
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "LDC Tools - SharePoint List Creation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Create lists in order (dependencies matter)
$listOrder = @(
    "Projects-List-Schema.json",
    "Tasks-List-Schema.json",
    "Feedback-List-Schema.json",
    "Settings-List-Schema.json"
)

# First pass: Create all lists and non-lookup fields
Write-Host "PHASE 1: Creating lists and basic fields..." -ForegroundColor Cyan
foreach ($schemaFile in $listOrder) {
    $fullPath = Join-Path $ListsFolder $schemaFile
    if (Test-Path $fullPath) {
        Create-ListFromSchema -SchemaFile $fullPath
    } else {
        Write-Host "WARNING: Schema file not found: $fullPath" -ForegroundColor Red
    }
}

# Second pass: Create lookup fields (now that all lists exist)
Write-Host "`nPHASE 2: Creating lookup fields..." -ForegroundColor Cyan
foreach ($schemaFile in $listOrder) {
    $fullPath = Join-Path $ListsFolder $schemaFile
    if (Test-Path $fullPath) {
        Create-LookupFields -SchemaFile $fullPath
    }
}

# ============================================================================
# SEED DEFAULT DATA
# ============================================================================

Write-Host "`nPHASE 3: Seeding default data..." -ForegroundColor Cyan

# Seed Settings list
$settingsSchema = Get-Content (Join-Path $ListsFolder "Settings-List-Schema.json") | ConvertFrom-Json

if ($settingsSchema.defaultData) {
    Write-Host "  Adding default settings..." -ForegroundColor Green
    
    foreach ($setting in $settingsSchema.defaultData) {
        Add-PnPListItem -List "LDC_Settings" -Values @{
            Title = $setting.Title
            SettingValue = $setting.SettingValue
            SettingType = $setting.SettingType
            Category = $setting.Category
            Description = $setting.Description
            IsActive = $setting.IsActive
        } | Out-Null
        
        Write-Host "    - $($setting.Title)" -ForegroundColor Gray
    }
}

# ============================================================================
# COMPLETION
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "SharePoint Lists Created Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify lists in SharePoint: $SiteUrl" -ForegroundColor White
Write-Host "2. Import the Power Apps package" -ForegroundColor White
Write-Host "3. Connect Power Apps to these SharePoint lists" -ForegroundColor White
Write-Host "4. Test the application`n" -ForegroundColor White

# Disconnect
Disconnect-PnPOnline
