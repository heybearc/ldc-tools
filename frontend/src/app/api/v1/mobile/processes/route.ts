import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';
import { processTemplateJson, validateProcessTemplate } from '@/lib/processes';
import { hiddenReleaseCheckProcess } from '@/lib/release-check-cleanup';

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    const canManage = await canManageGroup(actor);
    const [templates, projects] = await Promise.all([
      prisma.processTemplate.findMany({
        where: {
          constructionGroupId: actor.constructionGroupId,
          isActive: true,
          ...(canManage ? {} : { status: 'PUBLISHED' as const }),
          ...hiddenReleaseCheckProcess,
        },
        include: { steps: { orderBy: { position: 'asc' } } },
        orderBy: { name: 'asc' },
      }),
      canManage
        ? prisma.project.findMany({
            where: { constructionGroupId: actor.constructionGroupId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);
    return NextResponse.json({
      canManage,
      projects,
      templates: templates.map((template) => ({
        ...processTemplateJson(template),
        steps: template.steps.map((step) => ({
          id: step.id,
          title: step.title,
          detail: step.detail,
        })),
      })),
    });
  } catch (error) {
    console.error('Mobile processes error:', error);
    return NextResponse.json({ error: 'Could not load processes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can add a process' }, { status: 403 });
    }
    const parsed = validateProcessTemplate(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const created = await prisma.processTemplate.create({
      data: {
        constructionGroupId: actor.constructionGroupId,
        name: parsed.value.name,
        purpose: parsed.value.purpose,
        appliesTo: parsed.value.appliesTo,
        cadence: parsed.value.cadence,
        customEvery: parsed.value.customEvery,
        customUnit: parsed.value.customUnit,
        status: 'DRAFT',
        createdById: actor.id,
        steps: {
          create: parsed.value.steps.map((step, index) => ({
            position: index,
            title: step.title,
            detail: step.detail,
            explanation: step.explanation,
            referenceUrl: step.referenceUrl,
          })),
        },
      },
      select: { id: true, name: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Mobile create process error:', error);
    return NextResponse.json({ error: 'Could not add the process' }, { status: 500 });
  }
}
