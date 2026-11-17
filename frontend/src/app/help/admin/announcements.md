# Managing Announcements

## Overview
The announcements system allows administrators to post important updates, warnings, and urgent notices that appear at the top of every page in LDC Tools.

## Creating an Announcement

### Step 1: Access Announcements
1. Click **Admin** in the main navigation
2. Select **Announcements** from the admin panel

### Step 2: Create New Announcement
1. Click the **New Announcement** button
2. Fill in the announcement form:
   - **Title:** Brief, attention-grabbing headline (max 200 characters)
   - **Message:** Detailed announcement text (max 2000 characters)
   - **Type:** Choose the urgency level
   - **Construction Group:** Leave on Global for the whole app, or pick one construction group
   - **Start Date:** Optional - when to start showing the announcement
   - **End Date:** Optional - when to stop showing the announcement
   - **Active:** Toggle to enable/disable the announcement

3. Click **Create Announcement**

## Announcement Types

### 🔵 Info (Blue)
- General information and updates
- Non-urgent announcements
- Regular communications
- **Example:** "New training materials available in the Help Center"

### ⚠️ Warning (Yellow)
- Important notices requiring attention
- Upcoming changes or deadlines
- Cautionary information
- **Example:** "System maintenance scheduled for this weekend"

### 🚨 Urgent (Red)
- Critical alerts requiring immediate attention
- Emergency notifications
- Time-sensitive urgent matters
- **Example:** "Project deadline moved up - action required today"

## Targeting Options

### Global Announcements
- Leave **Construction Group** blank
- Shows to all users across all CGs
- Use for system-wide updates

### Construction Group Specific
- Select a specific **Construction Group**
- Only users in that CG will see it
- Use for CG-specific information

## Scheduling Announcements

### Immediate Display
- Leave **Start Date** and **End Date** blank
- Announcement shows immediately and indefinitely
- Manually deactivate when no longer needed

### Scheduled Start
- Set a **Start Date**
- Announcement won't appear until that date
- Useful for planning ahead

### Auto-Expiring
- Set an **End Date**
- Announcement automatically stops showing after that date
- Perfect for time-sensitive information

### Date Range
- Set both **Start Date** and **End Date**
- Announcement shows only during that period
- Ideal for events or temporary notices

## Managing Existing Announcements

### Editing an Announcement
1. Find the announcement in the list
2. Click **Edit**
3. Make your changes
4. Click **Update Announcement**

### Deactivating an Announcement
1. Click **Edit** on the announcement
2. Uncheck **Active**
3. Click **Update Announcement**
- The announcement is preserved but hidden from users

### Deleting an Announcement
1. Click **Delete** on the announcement
2. Confirm the deletion
- This permanently removes the announcement

## User Experience

### How Users See Announcements
- Announcements appear at the top of every page
- Color-coded by type (blue/yellow/red)
- Icon indicates urgency level
- Users can dismiss announcements (per session)
- Dismissed announcements return on next login

### Dismissal Behavior
- Users can click the X to hide an announcement
- Dismissal is session-based (not permanent)
- Announcement reappears on next login
- Cannot be permanently dismissed by users

## Best Practices

### Writing Effective Announcements

✅ **Do:**
- Keep titles short and clear
- Use action-oriented language
- Include specific dates and deadlines
- Provide clear next steps
- Use appropriate urgency levels
- Test with a short message first

❌ **Don't:**
- Overuse urgent announcements
- Write overly long messages
- Leave announcements active indefinitely
- Use ALL CAPS or excessive punctuation
- Post duplicate announcements
- Forget to set end dates for temporary notices

### Urgency Guidelines

**Use INFO for:**
- General updates and news
- New features or improvements
- Training opportunities
- Helpful tips and reminders

**Use WARNING for:**
- Upcoming maintenance
- Important deadlines
- Policy changes
- Required actions (non-urgent)

**Use URGENT for:**
- System outages
- Emergency situations
- Critical deadlines (today/tomorrow)
- Safety alerts

### Targeting Best Practices

1. **Start Global, Then Narrow**
   - Test with global announcements first
   - Pick one construction group when the notice is only for that group

2. **Avoid Over-Targeting**
   - Don't create multiple similar announcements for different groups
   - Consider if a global announcement would work

## Troubleshooting

### Announcement Not Showing
- Check that **Active** is enabled
- Verify **Start Date** hasn't been set to future
- Confirm **End Date** hasn't passed
- Verify **Construction Group** is Global, or matches the user's group

### Too Many Announcements
- Review and deactivate outdated announcements
- Consolidate similar announcements
- Use end dates to auto-expire temporary notices
- Limit to 2-3 active announcements at once

### Users Missing Important Announcements
- Use URGENT type for critical information
- Avoid announcement fatigue (too many active)
- Keep messages concise and scannable
- Follow up with email for critical items

## Examples

### Example 1: System Maintenance
```
Title: Scheduled System Maintenance
Type: WARNING
Message: LDC Tools will be offline for maintenance this Saturday, 
December 21st from 8:00 AM to 12:00 PM. Please save your work 
before Friday evening. The system will be unavailable during this time.
Start Date: December 19, 2025
End Date: December 21, 2025
CG: (blank - global)
Roles: (blank - all roles)
```

### Example 2: CG-Specific Update
```
Title: New Project Assignments Available
Type: INFO
Message: Construction Group 01.12 has new project assignments ready 
for review. Trade Team Overseers, please check your dashboards and 
assign crews by end of week.
Start Date: (blank - immediate)
End Date: December 27, 2025
CG: Construction Group 01.12
Roles: TRADE_TEAM_OVERSEER, CONSTRUCTION_GROUP_OVERSEER
```

### Example 3: Urgent Alert
```
Title: Project Deadline Moved Up
Type: URGENT
Message: URGENT: The Kingdom Hall renovation project deadline has 
been moved to December 20th. All outstanding work must be completed 
by tomorrow. Contact your Trade Team Overseer immediately.
Start Date: (blank - immediate)
End Date: December 20, 2025
CG: (blank - global)
Roles: (blank - all roles)
```

## Related Help Topics
- [Admin Panel Overview](./index.md)
- [User Management](./users.md)
- [Email Configuration](./email-config.md)
- [System Settings](./system.md)
