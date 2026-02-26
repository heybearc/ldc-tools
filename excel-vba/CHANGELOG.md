# Changelog - LDC Tools v2 (Excel VBA)

All notable changes to the Excel VBA version of LDC Tools will be documented in this file.

## [2.0.0] - Initial Release

### Added
- Complete Excel VBA rewrite of LDC Tools web application
- Self-contained, offline operation (no internet required)
- Web-app-like UI with navigation panel and views
- Dashboard view with KPI cards and recent projects
- Projects management (list and detail views)
- Tasks management (list view and project-linked tasks)
- People management (placeholder view)
- Reports view (placeholder)
- Admin/Settings view (placeholder)
- Data model using Excel Tables (ListObjects)
- MVC-inspired architecture with separated modules
- Sample data seeding for demonstration
- Comprehensive documentation

### Modules
- `modApp.bas` - Application bootstrap and routing
- `modNav.bas` - Navigation management
- `modUI.bas` - UI rendering for all views
- `modData.bas` - Data access layer (CRUD operations)
- `modValidation.bas` - Data validation rules
- `modUtils.bas` - Utility functions
- `ThisWorkbook.cls` - Workbook event handlers

### Data Tables
- `tblProjects` - Project data storage
- `tblTasks` - Task data storage
- `tblPeople` - People/users data storage
- `tblSettings` - Application settings
- `tblLookups` - Lookup values (statuses, priorities, etc.)

### Documentation
- `README.md` - User guide and overview
- `IMPLEMENTATION-GUIDE.md` - Step-by-step build instructions
- `ARCHITECTURE.md` - Technical architecture documentation
- `MIGRATION-GUIDE.md` - Web-to-Excel migration guide
- `CHANGELOG.md` - Version history (this file)

### Features
- Navigation panel with 6 main views
- Dashboard with 4 KPI cards
- Recent projects list (max 5)
- Quick action buttons (New Project, New Task)
- Projects list with filtering capability
- Project detail view with task list
- Task list view
- Color-coded status and risk indicators
- Responsive UI with shape-based buttons
- Hidden data sheets for data protection
- Automatic initialization on workbook open
- Sample data for testing and demonstration

### Known Limitations
- Single-user only (not designed for concurrent editing)
- Optimal for <1000 projects, <5000 tasks
- No undo functionality for VBA actions
- Manual refresh required (no real-time updates)
- Form dialogs not yet implemented (placeholders only)
- People, Reports, and Admin views are placeholders

### Platform Support
- Windows: Excel 2016 or later (full support)
- Mac: Excel 2016 or later (full support with minor limitations)

## [Unreleased] - Future Enhancements

### Planned Features
- UserForm dialogs for data entry (New Project, New Task, Edit forms)
- Search functionality in header bar
- Filter dropdowns for Projects and Tasks views
- Pagination for large datasets
- Export to CSV functionality
- Export to PDF functionality (if available)
- Charts and pivot tables in Reports view
- Lookup value management in Admin view
- Settings configuration in Admin view
- Import/Export data functionality
- Backup/Restore functionality
- Enhanced error handling and logging
- Performance optimizations for large datasets
- Class-based entity models (clsProject, clsTask, clsPerson)
- Event system for data changes
- Plugin architecture for extensibility

### Under Consideration
- Multi-user support via SharePoint/Excel Online
- Real-time collaboration features
- Mobile optimization
- Advanced reporting and analytics
- Integration with external systems
- Automated backup scheduling
- Version control for data changes
- Audit trail for all modifications

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible changes
- MINOR version for new functionality (backwards-compatible)
- PATCH version for bug fixes (backwards-compatible)

## Migration from Web Version

See `MIGRATION-GUIDE.md` for detailed instructions on migrating data from the web-based LDC Tools to this Excel VBA version.

## Contributing

This is an internal project. For changes:
1. Create a feature branch
2. Make changes
3. Export VBA modules to `excel-vba/vba-modules/`
4. Update documentation
5. Update this CHANGELOG
6. Commit and push to repository

## License

Internal use only. Not for redistribution.
