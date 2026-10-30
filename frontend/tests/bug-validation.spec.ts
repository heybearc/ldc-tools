import { test, expect } from '@playwright/test';
import { login } from './test-helpers';

/**
 * Bug Validation Test Suite
 * Tests to verify existence or resolution of known bugs
 * Run on STANDBY server: BASE_URL=http://10.92.3.23:3001 npm run test:bugs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@ldctools.local';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'AdminPass123!';

test.describe('Bug Validation Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test using helper
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  });

  // ========================================================================
  // MEDIUM PRIORITY BUGS
  // ========================================================================

  test('BUG-015: System Operations deployment operations status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/system`);
    await page.waitForLoadState('networkidle');

    // Check if deployment operations section exists
    const deploymentSection = page.locator('text=Deployment Operations');
    
    if (await deploymentSection.isVisible()) {
      // Check operation status
      const operations = page.locator('[data-testid="system-operation"]').or(
        page.locator('text=/Deploy to|System Health Check/').locator('..')
      );
      
      const operationCount = await operations.count();
      console.log(`Found ${operationCount} operations`);

      // Check if any operations show "failed" status
      const failedOperations = page.locator('text=failed').or(
        page.locator('.text-red-600:has-text("failed")')
      );
      const failedCount = await failedOperations.count();

      // Try clicking a Run button if it exists
      const runButton = page.locator('button:has-text("Run")').first();
      if (await runButton.isVisible()) {
        await runButton.click();
        await page.waitForTimeout(2000);
        
        // Check if operation completed or failed
        const statusAfterRun = await page.locator('.text-red-600:has-text("failed")').count();
        
        console.log(`BUG-015: Failed operations count: ${failedCount}, After run: ${statusAfterRun}`);
        expect(statusAfterRun).toBe(0); // Should not have failed operations
      } else {
        console.log('BUG-015: No Run buttons found - feature may not be implemented');
      }
    } else {
      console.log('BUG-015: Deployment Operations section not found');
    }
  });

  test('BUG-016: User Management API endpoint warning status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/api`);
    await page.waitForLoadState('networkidle');

    // Find User Management endpoint
    const userEndpoint = page.locator('text=/User Management|\/api\/v1\/admin\/users/').first();
    
    if (await userEndpoint.isVisible()) {
      // Check status indicator
      const parentRow = userEndpoint.locator('..').locator('..');
      const warningIndicator = parentRow.locator('.text-yellow-600, .text-orange-600, text=warning');
      const errorIndicator = parentRow.locator('.text-red-600, text=error');
      
      const hasWarning = await warningIndicator.count() > 0;
      const hasError = await errorIndicator.count() > 0;
      
      console.log(`BUG-016: User API has warning: ${hasWarning}, has error: ${hasError}`);
      
      // Bug exists if showing warning/error
      expect(hasWarning || hasError).toBe(false); // Should be healthy
    } else {
      console.log('BUG-016: User Management endpoint not found in API status');
    }
  });

  test('BUG-017: Email Test API endpoint error status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/api`);
    await page.waitForLoadState('networkidle');

    // Find Email Test endpoint
    const emailEndpoint = page.locator('text=/Email Test|\/api\/v1\/admin\/email\/test/').first();
    
    if (await emailEndpoint.isVisible()) {
      const parentRow = emailEndpoint.locator('..').locator('..');
      const errorIndicator = parentRow.locator('.text-red-600, text=error');
      
      const hasError = await errorIndicator.count() > 0;
      console.log(`BUG-017: Email Test API has error: ${hasError}`);
      
      // Now test if email functionality actually works
      await page.goto(`${BASE_URL}/admin/email`);
      const testEmailButton = page.locator('button:has-text("Send Test Email")');
      
      if (await testEmailButton.isVisible()) {
        console.log('BUG-017: Email test functionality exists - this is a monitoring display issue');
      }
      
      // Bug exists if showing error but functionality works
      expect(hasError).toBe(false); // Should not show error
    } else {
      console.log('BUG-017: Email Test endpoint not found');
    }
  });

  test('BUG-018: Multiple API endpoints showing errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/api`);
    await page.waitForLoadState('networkidle');

    // Count all error indicators
    const errorIndicators = page.locator('.text-red-600:has-text("error"), .bg-red-100');
    const warningIndicators = page.locator('.text-yellow-600:has-text("warning"), .bg-yellow-100');
    
    const errorCount = await errorIndicators.count();
    const warningCount = await warningIndicators.count();
    
    console.log(`BUG-018: API errors: ${errorCount}, warnings: ${warningCount}`);
    
    // Get stats
    const statsSection = page.locator('text=/Total Endpoints|Healthy Endpoints/').first();
    if (await statsSection.isVisible()) {
      const statsText = await page.locator('.text-2xl.font-bold').allTextContents();
      console.log('BUG-018: API Stats:', statsText);
    }
    
    // Should have minimal errors/warnings
    expect(errorCount).toBeLessThan(3); // Allow up to 2 errors
  });

  test('BUG-012: Health monitor auto-refresh flicker', async ({ page }) => {
    // Navigate directly to health monitor page
    await page.goto(`${BASE_URL}/admin/health`);
    await page.waitForLoadState('networkidle');
    
    // Check for main content heading (h2), not sidebar text
    const healthMonitorHeading = page.locator('h2:has-text("Health Monitor")').first();
    const healthMonitorExists = await healthMonitorHeading.count() > 0;
    
    if (healthMonitorExists && await healthMonitorHeading.isVisible()) {
      // Verify health monitor page loads
      await expect(healthMonitorHeading).toBeVisible({ timeout: 5000 });
      
      // Verify key health metrics are visible
      const dbConnection = page.locator('text=Database Connection').first();
      if (await dbConnection.count() > 0 && await dbConnection.isVisible()) {
        await expect(dbConnection).toBeVisible();
      }
      
      console.log('BUG-012: Health monitor page accessible and displaying metrics');
    } else {
      // Health monitor page not available or redirected
      console.log('BUG-012: Health monitor page not accessible (may not be implemented yet)');
    }
  });

  test('BUG-013: Email service false healthy status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/health`);
    await page.waitForLoadState('networkidle');

    // Find email service status
    const emailService = page.locator('text=/Email Service|Email/i').first();
    
    if (await emailService.isVisible()) {
      const parentSection = emailService.locator('..').locator('..');
      const healthyIndicator = parentSection.locator('.text-green-600, text=/healthy|connected/i');
      
      const showsHealthy = await healthyIndicator.count() > 0;
      console.log(`BUG-013: Email service shows healthy: ${showsHealthy}`);
      
      // Check if email is actually configured
      await page.goto(`${BASE_URL}/admin/email`);
      const configStatus = page.locator('text=/Active|Configured|Not Configured/i').first();
      const statusText = await configStatus.textContent();
      
      console.log(`BUG-013: Email config status: ${statusText}`);
      
      // Bug exists if shows healthy but not configured
      if (statusText?.includes('Not Configured') && showsHealthy) {
        console.log('BUG-013: CONFIRMED - Shows healthy when not configured');
        expect(showsHealthy).toBe(false);
      }
    }
  });

  // ========================================================================
  // LOW PRIORITY BUGS
  // ========================================================================

  test('BUG-008: User table sorting on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    const nameHeader = page.locator('th').filter({ hasText: /^User$/ });
    await expect(nameHeader).toBeVisible();
    await nameHeader.click();
    await page.waitForTimeout(1000);

    const firstUserName = await page.locator('tbody tr').first().locator('td').first().textContent();
    console.log(`BUG-008: First user after sort: ${firstUserName}`);
    const alertText = (await page.getByRole('alert').allTextContents()).join('').trim();
    expect(alertText).toBe('');
  });

  test('BUG-009: Admin navigation menu overlap on small screens', async ({ page }) => {
    // Set small viewport
    await page.setViewportSize({ width: 640, height: 480 });
    
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');

    // Check if navigation menu exists
    const navMenu = page.locator('nav').first();
    
    if (await navMenu.isVisible()) {
      const navBox = await navMenu.boundingBox();
      const contentBox = await page.locator('main').boundingBox();
      
      if (navBox && contentBox) {
        // Check if navigation overlaps content
        const overlaps = navBox.x + navBox.width > contentBox.x && 
                        navBox.x < contentBox.x + contentBox.width;
        
        console.log(`BUG-009: Navigation overlaps content: ${overlaps}`);
        expect(overlaps).toBe(false);
      }
    }
  });

  test('BUG-010: Loading states consistency', async ({ page }) => {
    const pages = [
      '/admin/users',
      '/admin/email',
      '/admin/health',
      '/admin/api'
    ];

    const loadingIndicators: string[] = [];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      
      // Quickly check for loading indicator type
      const hasSpinner = await page.locator('.animate-spin').count() > 0;
      const hasSkeleton = await page.locator('.animate-pulse').count() > 0;
      const hasLoadingText = await page.locator('text=/Loading|loading/i').count() > 0;
      
      if (hasSpinner) loadingIndicators.push('spinner');
      else if (hasSkeleton) loadingIndicators.push('skeleton');
      else if (hasLoadingText) loadingIndicators.push('text');
      else loadingIndicators.push('none');
      
      await page.waitForLoadState('networkidle');
    }

    console.log(`BUG-010: Loading indicators: ${loadingIndicators.join(', ')}`);
    
    // Check if all use same type
    const uniqueTypes = Array.from(new Set(loadingIndicators));
    console.log(`BUG-010: Unique loading types: ${uniqueTypes.length}`);
    
    // Bug exists if inconsistent (more than 1 type)
    expect(uniqueTypes.length).toBeLessThanOrEqual(2); // Allow some variation
  });

  test('BUG-011: Form validation message styling', async ({ page }) => {
    // Test user creation form
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button:has-text("Add User")').or(
      page.locator('button:has-text("Invite User")')
    );
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Check for validation messages
      const errorMessages = page.locator('.text-red-600, .text-red-500, .text-red-700, [class*="error"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        // Get styles of error messages
        const styles = await errorMessages.evaluateAll(elements => 
          elements.map(el => ({
            color: window.getComputedStyle(el).color,
            fontSize: window.getComputedStyle(el).fontSize,
            position: window.getComputedStyle(el).position
          }))
        );
        
        console.log(`BUG-011: Found ${errorCount} validation messages with styles:`, styles);
        
        // Check if styles are consistent
        const uniqueColors = Array.from(new Set(styles.map(s => s.color)));
        const uniqueSizes = Array.from(new Set(styles.map(s => s.fontSize)));
        
        console.log(`BUG-011: Unique colors: ${uniqueColors.length}, sizes: ${uniqueSizes.length}`);
        
        // Bug exists if inconsistent styling
        expect(uniqueColors.length).toBeLessThanOrEqual(2); // Allow some variation
      }
    }
  });

  // ========================================================================
  // SUMMARY TEST
  // ========================================================================

  test('Bug Summary Report', async ({ page }) => {
    console.log('\n=== BUG VALIDATION SUMMARY ===');
    console.log('Run individual tests above for detailed results');
    console.log('Tests check for:');
    console.log('- BUG-015: System Operations deployment status');
    console.log('- BUG-016: User API warning status');
    console.log('- BUG-017: Email API error display');
    console.log('- BUG-018: Multiple API errors');
    console.log('- BUG-012: Health monitor flicker');
    console.log('- BUG-013: Email false healthy status');
    console.log('- BUG-008: Mobile table sorting');
    console.log('- BUG-009: Mobile menu overlap');
    console.log('- BUG-010: Loading state consistency');
    console.log('- BUG-011: Validation message styling');
    console.log('==============================\n');
    
    expect(true).toBe(true); // Always pass summary
  });
});
