import assert from 'node:assert/strict';
import test from 'node:test';
import { pastedChatText, splitChatLinks } from './chat-links.ts';

test('a web address in a message is a link, and the sentence around it stays text', () => {
  const parts = splitChatLinks('See https://ldctools.com/help, then reply.');
  assert.deepEqual(parts, [
    { text: 'See ', href: null },
    { text: 'https://ldctools.com/help', href: 'https://ldctools.com/help' },
    { text: ',', href: null },
    { text: ' then reply.', href: null },
  ]);
});

test('a www address and a parenthetical link stay intact', () => {
  assert.equal(splitChatLinks('www.jw.org')[0].href, 'https://www.jw.org/');
  const parts = splitChatLinks('(https://example.com/a(b))');
  assert.equal(parts[1].text, 'https://example.com/a(b)');
  assert.equal(parts[1].href, 'https://example.com/a(b)');
  assert.equal(parts[2].text, ')');
});

test('a pasted link title keeps the address', () => {
  const html = '<a href="https://example.com/docs?x=1&amp;y=2">Project notes</a>';
  assert.equal(
    pastedChatText({ plain: 'Project notes', html, uriList: '' }),
    'Project notes\nhttps://example.com/docs?x=1&y=2',
  );
  assert.equal(
    pastedChatText({ plain: 'https://example.com/docs', html: '<a href="https://example.com/docs">https://example.com/docs</a>', uriList: '' }),
    null,
  );
});

test('a javascript link is left as text', () => {
  assert.equal(pastedChatText({ plain: 'Click', html: '<a href="javascript:alert(1)">Click</a>', uriList: '' }), null);
  assert.equal(splitChatLinks('javascript:alert(1)')[0].href, null);
});
