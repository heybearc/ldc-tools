import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cgScope = await getCGScope(session.user.id);
    if (!cgScope) {
      return NextResponse.json({ error: 'No construction group access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    const tradeTeams = await prisma.tradeTeam.findMany({
      where: {
        constructionGroupId: cgScope.constructionGroupId,
        isActive: true,
      },
      include: {
        crews: {
          where: { isActive: true },
          include: {
            oversight: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                contact: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        oversight: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            contact: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (format === 'pdf') {
      const html = generatePDFHTML(tradeTeams);
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="trade-teams-overview-${new Date().toISOString().split('T')[0]}.html"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error: any) {
    console.error('Trade teams overview export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generatePDFHTML(tradeTeams: any[]): string {
  const formatUserName = (user: any) => user?.name || user?.email?.split('@')[0] || '';
  
  const getOversightByRole = (oversight: any[], role: string) => {
    return oversight.filter((o: any) => o.role === role);
  };

  const formatUserList = (assignments: any[]) => {
    const names = assignments.map((assignment: any) => {
      if (assignment.contact) return `${assignment.contact.firstName} ${assignment.contact.lastName}`.trim();
      return formatUserName(assignment.user);
    }).filter(Boolean);
    if (names.length === 0) return '—';
    return names.join(', ');
  };

  const rows = tradeTeams.map((team: any) => {
    const tto = getOversightByRole(team.oversight, 'TRADE_TEAM_OVERSEER');
    const ttoa = getOversightByRole(team.oversight, 'TRADE_TEAM_OVERSEER_ASSISTANT');
    const support = getOversightByRole(team.oversight, 'TRADE_TEAM_SUPPORT');

    let teamRows = `
      <tr class="trade-team-header">
        <td colspan="5"><strong>${team.name}</strong></td>
      </tr>
      <tr>
        <td><em>Team Level</em></td>
        <td>${formatUserList(tto)}</td>
        <td>${formatUserList(ttoa)}</td>
        <td>${formatUserList(support)}</td>
        <td>${team.description || '—'}</td>
      </tr>`;

    team.crews.forEach((crew: any) => {
      const tco = getOversightByRole(crew.oversight, 'TRADE_CREW_OVERSEER');
      const tcoa = getOversightByRole(crew.oversight, 'TRADE_CREW_OVERSEER_ASSISTANT');
      const crewSupport = getOversightByRole(crew.oversight, 'TRADE_CREW_SUPPORT');

      teamRows += `
      <tr>
        <td class="crew-name">&nbsp;&nbsp;${crew.name}</td>
        <td>${formatUserList(tco)}</td>
        <td>${formatUserList(tcoa)}</td>
        <td>${formatUserList(crewSupport)}</td>
        <td>${crew.description || '—'}</td>
      </tr>`;
    });

    return teamRows;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Trade Teams & Crews Overview</title>
  <style>
    @media print {
      @page { margin: 0.5in; }
      body { margin: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      font-size: 18pt;
      margin-bottom: 5px;
    }
    .date {
      text-align: center;
      font-size: 10pt;
      color: #666;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      font-size: 10pt;
    }
    td {
      font-size: 10pt;
    }
    .trade-team-header {
      background-color: #dbeafe;
      font-weight: bold;
      font-size: 11pt;
    }
    .crew-name {
      font-weight: 600;
    }
  </style>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</head>
<body>
  <h1>Trade Teams & Crews Overview</h1>
  <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Trade Team / Crew</th>
        <th style="width: 20%;">Overseer</th>
        <th style="width: 20%;">Assistants</th>
        <th style="width: 20%;">Support</th>
        <th style="width: 20%;">Description</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>`;
}
