# Quick Start - PowerShell Deployment

## Step-by-Step Commands

### 1. Open PowerShell

**Windows:**
- Press `Win + X`
- Select "Windows PowerShell" or "Terminal"

**Mac:**
- Open Terminal
- Install PowerShell if needed: `brew install powershell/tap/powershell`
- Run: `pwsh`

### 2. Navigate to Scripts Folder

```powershell
cd /Users/cory/Projects/ldc-tools/powerapps-sharepoint/scripts
```

### 3. Test Connection (Run This First!)

```powershell
.\Test-Connection.ps1
```

**What this does:**
- Checks if PnP PowerShell is installed (installs if needed)
- Prompts you for your SharePoint site URL
- Opens browser for authentication
- Tests if you can create lists
- Reports success or failure

**You'll be prompted for:**
```
SharePoint Site URL: https://yourtenant.sharepoint.com/sites/YourSite
```

**Expected output if successful:**
```
========================================
Connection Test: SUCCESS!
========================================

Summary:
  ✓ PnP PowerShell is installed and working
  ✓ Connected to SharePoint site
  ✓ Have permissions to create lists
  ✓ Ready to run the deployment script
```

### 4. If Test Succeeds, Create Lists

**Edit the deployment script first:**
```powershell
# Open in your editor
code Create-SharePoint-Lists.ps1

# Or use nano/vim
nano Create-SharePoint-Lists.ps1
```

**Update line 12:**
```powershell
# Change this:
$SiteUrl = "https://yourtenant.sharepoint.com/sites/YourSite"

# To your actual site URL (from step 3)
$SiteUrl = "https://yourcompany.sharepoint.com/sites/LDCTools"
```

**Save and run:**
```powershell
.\Create-SharePoint-Lists.ps1
```

**Expected output:**
```
Connecting to SharePoint site...
PHASE 1: Creating lists and basic fields...
  Creating list: LDC_Projects
  Adding custom fields...
    - Project Number (Text)
    - Status (Choice)
    - Project Owner (User)
    ...
  List 'LDC_Projects' created successfully!

  Creating list: LDC_Tasks
  ...

PHASE 2: Creating lookup fields...
  Creating lookup fields for: LDC_Tasks
    - Project -> LDC_Projects

PHASE 3: Seeding default data...
  Adding default settings...
    - AppVersion
    - DefaultProjectStatus
    ...

========================================
SharePoint Lists Created Successfully!
========================================
```

### 5. Verify in SharePoint

1. Open your SharePoint site in browser
2. Go to "Site Contents"
3. You should see:
   - LDC_Projects
   - LDC_Tasks
   - LDC_Feedback
   - LDC_Settings

## Troubleshooting

### "PnP.PowerShell cannot be installed"

**Issue:** Your organization blocks PowerShell module installation

**Solution:** Use manual deployment
- Follow `docs/DEPLOYMENT-GUIDE.md` Section 2.2 (Manual List Creation)
- Create lists through SharePoint UI

### "Access Denied" or "Permission Error"

**Issue:** You don't have permissions to create lists

**Solutions:**
1. Ask site owner to grant you "Contribute" or "Owner" permissions
2. Ask site owner to run the script for you
3. Use manual deployment method

### "Cannot connect to SharePoint"

**Possible causes:**
- Wrong site URL
- MFA/Conditional Access blocking
- Network/firewall restrictions
- Not signed into correct account

**Solutions:**
1. Verify site URL is correct (copy from browser)
2. Try accessing site in browser first
3. Check with IT if PowerShell access is blocked
4. Use manual deployment method

### "List already exists"

**Issue:** Lists were partially created or already exist

**Solution:** Script will skip existing lists automatically
- Or delete existing lists and re-run
- Or continue with manual setup for missing lists

## If PowerShell Doesn't Work

**Don't worry!** Manual deployment is straightforward:

1. Open `docs/DEPLOYMENT-GUIDE.md`
2. Go to **Step 2: Create SharePoint Lists**
3. Follow **Option B: Manual List Creation**
4. Takes about 60 minutes but works in any environment

## What Happens After Lists Are Created

1. **Verify data** - Check lists in SharePoint
2. **Build Power Apps** - Follow deployment guide Step 3
3. **Connect app to lists** - Link Power Apps to SharePoint
4. **Test** - Create sample project and task
5. **Deploy** - Share with users

## Need Help?

- **Connection issues:** Check `docs/DEPLOYMENT-GUIDE.md` troubleshooting section
- **PowerShell blocked:** Use manual deployment (Section 2.2)
- **Permission errors:** Contact SharePoint site owner
- **Other issues:** Review full deployment guide

---

## Quick Command Reference

```powershell
# Test connection
.\Test-Connection.ps1

# Create all lists (after editing site URL)
.\Create-SharePoint-Lists.ps1

# Check PowerShell version
$PSVersionTable.PSVersion

# Install PnP manually if needed
Install-Module -Name PnP.PowerShell -Scope CurrentUser

# Connect manually
Connect-PnPOnline -Url "https://yoursite.sharepoint.com/sites/YourSite" -Interactive

# List all SharePoint lists
Get-PnPList

# Disconnect
Disconnect-PnPOnline
```

---

**Ready to try? Run `.\Test-Connection.ps1` first!**
