import { prisma } from './prisma';
import { sendEmail } from './email';

interface ScheduleChangeDetails {
  projectId: string;
  projectName: string;
  scheduleVersionId: string;
  versionName: string;
  changeDescription: string;
  changedBy: string;
  changedByName: string;
}

interface NotificationRecipient {
  email: string;
  name: string;
  role?: string;
}

export async function createScheduleChangeAnnouncement(
  details: ScheduleChangeDetails,
  sendNotifications: boolean = false,
  notifyRoles: string[] = []
): Promise<string> {
  // Create announcement
  const announcement = await prisma.announcement.create({
    data: {
      title: `Schedule Update: ${details.projectName}`,
      message: `The project schedule has been updated.\n\n${details.changeDescription}\n\nVersion: ${details.versionName}`,
      type: 'INFO',
      isActive: true,
      createdBy: details.changedBy,
      targetRoles: []
    }
  });

  // Send email notifications if requested
  if (sendNotifications && notifyRoles.length > 0) {
    await sendScheduleChangeNotifications(details, notifyRoles);
  }

  return announcement.id;
}

async function sendScheduleChangeNotifications(
  details: ScheduleChangeDetails,
  notifyRoles: string[]
): Promise<void> {
  // Get users with the specified roles
  const recipients: NotificationRecipient[] = [];

  if (notifyRoles.length > 0) {
    // Get all project assignments for this project
    const projectAssignments = await prisma.projectAssignment.findMany({
      where: {
        projectId: details.projectId,
        isActive: true
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });

    // Filter by role names and add to recipients
    projectAssignments.forEach(assignment => {
      if (notifyRoles.includes(assignment.role.name) && assignment.user.email) {
        recipients.push({
          email: assignment.user.email,
          name: assignment.user.name || 'User',
          role: assignment.role.displayName
        });
      }
    });
  }

  // Get volunteers assigned to crews on this project
  const crewAssignments = await prisma.projectCrewAssignment.findMany({
    where: {
      projectId: details.projectId
    },
    include: {
      crew: {
        include: {
          volunteers: {
            include: {
              user: {
                select: {
                  email: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Add crew volunteers with user accounts
  crewAssignments.forEach(assignment => {
    assignment.crew.volunteers.forEach(volunteer => {
      if (volunteer.user?.email) {
        recipients.push({
          email: volunteer.user.email,
          name: volunteer.user.name || `${volunteer.firstName} ${volunteer.lastName}`,
          role: 'Crew Member'
        });
      }
    });
  });

  // Remove duplicates
  const uniqueRecipients = Array.from(
    new Map(recipients.map(r => [r.email, r])).values()
  );

  // Send emails to all recipients
  const emailPromises = uniqueRecipients.map(recipient =>
    sendEmail({
      to: recipient.email,
      subject: `Schedule Update: ${details.projectName}`,
      html: generateScheduleChangeEmail(details, recipient)
    })
  );

  await Promise.allSettled(emailPromises);
}

function generateScheduleChangeEmail(
  details: ScheduleChangeDetails,
  recipient: NotificationRecipient
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📅 Project Schedule Updated</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hello ${recipient.name},
        </p>
        
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          The schedule for <strong>${details.projectName}</strong> has been updated.
        </p>
        
        <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">What Changed</h2>
          <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
            ${details.changeDescription}
          </p>
        </div>
        
        <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>Schedule Version:</strong> ${details.versionName}
          </p>
          <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 14px;">
            <strong>Updated by:</strong> ${details.changedByName}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/projects/${details.projectId}/schedule" 
             style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            View Updated Schedule
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          You're receiving this notification because you're assigned to this project${recipient.role ? ` as ${recipient.role}` : ''}.
        </p>
      </div>
      
      <div style="background-color: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">LDC Tools - Construction Group Management</p>
      </div>
    </div>
  `;
}

export async function getProjectScheduleNotificationSettings(projectId: string) {
  // Get project with assignments to determine who can be notified
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          role: {
            select: {
              name: true,
              displayName: true
            }
          }
        }
      },
      crewAssignments: {
        include: {
          crew: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!project) {
    return null;
  }

  // Get unique roles from project assignments
  const availableRoles = Array.from(
    new Set(project.assignments.map(a => ({
      name: a.role.name,
      displayName: a.role.displayName
    })))
  );

  return {
    projectId: project.id,
    projectName: project.name,
    availableRoles,
    assignedUsers: project.assignments.map(a => ({
      userId: a.user.id,
      name: a.user.name,
      email: a.user.email,
      roleName: a.role.name,
      roleDisplayName: a.role.displayName
    })),
    assignedCrews: project.crewAssignments.map(ca => ({
      crewId: ca.crew.id,
      crewName: ca.crew.name
    }))
  };
}
