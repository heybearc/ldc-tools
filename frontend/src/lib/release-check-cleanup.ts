import { prisma } from '@/lib/prisma';

/** Release tests use these titles. They stay out of the work list and the phone app. */
// A missing requestor email must stay visible. SQL treats
// NOT (email = 'qa-crew@example.com') as unknown when email is null.
export const hiddenReleaseCheckWork = {
  AND: [
    { NOT: { title: { startsWith: 'QA ' } } },
    { NOT: { title: { contains: 'QA Volunteer' } } },
    {
      OR: [
        { requestorEmail: null },
        { NOT: { requestorEmail: 'qa-crew@example.com' } },
      ],
    },
  ],
};

export const hiddenReleaseCheckProcess = {
  NOT: { name: { startsWith: 'QA ' } },
};

// Release tests create work, processes, and chat whose titles start with "QA ".
// Personnel can remove that set after a run. Real crew requests stay.
export async function removeReleaseCheckData(constructionGroupId: string) {
  const channels = await prisma.chatChannel.findMany({
    where: { constructionGroupId },
    select: { id: true },
  });
  const channelIds = channels.map((channel) => channel.id);
  const qaMessages = channelIds.length === 0
    ? []
    : await prisma.chatMessage.findMany({
        where: { channelId: { in: channelIds }, body: { startsWith: 'QA ' } },
        select: { channelId: true },
      });
  const touched = [...new Set(qaMessages.map((message) => message.channelId))];
  const messages = touched.length === 0
    ? { count: 0 }
    : await prisma.chatMessage.deleteMany({
        where: { channelId: { in: touched }, body: { startsWith: 'QA ' } },
      });
  if (touched.length > 0) {
    await prisma.chatChannel.deleteMany({
      where: { id: { in: touched }, kind: 'DIRECT', messages: { none: {} } },
    });
  }

  const workItems = await prisma.workItem.deleteMany({
    where: {
      constructionGroupId,
      OR: [
        { title: { startsWith: 'QA ' } },
        { title: { startsWith: 'Release check' } },
        { title: { contains: 'QA Volunteer' } },
        { title: { contains: 'Release check volunteer' } },
        { requestorEmail: 'qa-crew@example.com' },
        { requestorEmail: 'release-check@example.com' },
      ],
    },
  });
  const processes = await prisma.processTemplate.deleteMany({
    where: {
      constructionGroupId,
      OR: [
        { name: { startsWith: 'QA ' } },
        { name: { startsWith: 'Release check' } },
      ],
    },
  });

  return {
    workItems: workItems.count,
    processes: processes.count,
    messages: messages.count,
  };
}
