export type PhoneStep = {
  tap?: string;
  tapId?: string;
  see?: string;
  seeId?: string;
};

export type PhoneFeature = {
  id: string;
  steps: PhoneStep[];
};

export const phoneFeatures: PhoneFeature[] = [
  {
    id: 'my-work',
    steps: [{ see: 'My Work' }, { seeId: 'screen-my-work' }],
  },
  {
    id: 'available',
    steps: [
      { tap: 'Available' },
      { see: 'Claimable work that no one has taken yet.' },
      { seeId: 'screen-available' },
    ],
  },
  {
    id: 'projects',
    steps: [{ tap: 'Projects' }, { seeId: 'screen-projects' }],
  },
  {
    id: 'directory',
    steps: [{ tap: 'Directory' }, { see: 'Construction group' }, { seeId: 'screen-directory' }],
  },
  {
    id: 'chat',
    steps: [{ tap: 'Chat' }, { see: 'Chats' }, { see: 'New chat' }, { seeId: 'screen-chat' }],
  },
  {
    id: 'more',
    steps: [{ tap: 'More' }, { see: 'Templates and starting work' }, { seeId: 'screen-more' }],
  },
  {
    id: 'processes',
    steps: [{ tap: 'More' }, { tapId: 'link-processes' }, { seeId: 'screen-processes' }],
  },
  {
    id: 'trade-teams',
    steps: [{ tap: 'More' }, { tapId: 'link-trade-teams' }, { seeId: 'screen-trade-teams' }],
  },
  {
    id: 'feedback',
    steps: [{ tap: 'More' }, { tapId: 'link-feedback' }, { see: 'Send feedback' }, { seeId: 'screen-feedback' }],
  },
  {
    id: 'help',
    steps: [
      { tap: 'More' },
      { tapId: 'link-help' },
      { see: 'These guides stay in the app. You do not need to sign in on the website.' },
      { seeId: 'screen-help' },
    ],
  },
];

function yamlString(value: string) {
  return JSON.stringify(value);
}

export function renderFeatureFlow(feature: PhoneFeature) {
  const lines = ['appId: com.ldctools.mobile', '---', '- runFlow: ../shared/sign-in.yaml'];
  for (const step of feature.steps) {
    if (step.tap) lines.push(`- tapOn: ${yamlString(step.tap)}`);
    if (step.tapId) lines.push('- tapOn:', `    id: ${yamlString(step.tapId)}`);
    if (step.see) lines.push(`- assertVisible: ${yamlString(step.see)}`);
    if (step.seeId) lines.push('- assertVisible:', `    id: ${yamlString(step.seeId)}`);
  }
  return `${lines.join('\n')}\n`;
}
