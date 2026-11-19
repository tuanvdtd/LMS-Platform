import {
  canDeleteComment,
  commentLink,
  excerptLine,
  noticeTitle,
  publicAuthor,
  recipients,
  removedCount,
  rootOf,
} from './post-engagement-rules.js';

describe('post-engagement-rules', () => {
  it('rootOf: trả lời một trả lời vẫn gắn về gốc', () => {
    expect(rootOf({ id: 'r', parentId: null })).toBe('r');
    expect(rootOf({ id: 'c', parentId: 'r' })).toBe('r');
  });

  it('recipients: bỏ người viết, gộp khi tác giả bài cũng là người được trả lời', () => {
    expect(recipients('w', 'a', null)).toEqual([{ userId: 'a', kind: 'comment' }]);
    expect(recipients('a', 'a', null)).toEqual([]);
    expect(recipients('w', 'a', 'x')).toEqual([
      { userId: 'x', kind: 'reply' },
      { userId: 'a', kind: 'comment' },
    ]);
    expect(recipients('w', 'a', 'a')).toEqual([{ userId: 'a', kind: 'reply' }]);
    expect(recipients('w', 'a', 'w')).toEqual([{ userId: 'a', kind: 'comment' }]);
  });

  it('canDeleteComment: người viết, tác giả bài, admin', () => {
    expect(canDeleteComment({ id: 'w', role: 'student' }, 'w', 'a')).toBe(true);
    expect(canDeleteComment({ id: 'a', role: 'student,instructor' }, 'w', 'a')).toBe(true);
    expect(canDeleteComment({ id: 'z', role: 'admin' }, 'w', 'a')).toBe(true);
    expect(canDeleteComment({ id: 'z', role: 'moderator' }, 'w', 'a')).toBe(false);
    expect(canDeleteComment({ id: 'z', role: null }, 'w', 'a')).toBe(false);
  });

  it('removedCount: gốc kéo theo trả lời', () => {
    expect(removedCount({ parentId: null, replyCount: 3 })).toBe(4);
    expect(removedCount({ parentId: 'r', replyCount: 0 })).toBe(1);
  });

  it('publicAuthor: staff đứng tên Aolumi', () => {
    expect(publicAuthor({ id: 'u', name: 'Lan', image: null, role: 'student' })).toEqual({ id: 'u', name: 'Lan', image: null });
    expect(publicAuthor({ id: 'u', name: 'Lan', role: 'student' })).toEqual({ id: 'u', name: 'Lan', image: null });
    expect(publicAuthor({ id: 'u', name: 'Admin', image: 'x', role: 'admin' })).toEqual({ id: null, name: 'Aolumi', image: null });
  });

  it('noticeTitle, commentLink, excerptLine', () => {
    expect(noticeTitle('comment', 'Lan', 'React')).toBe('Lan đã bình luận bài "React"');
    expect(noticeTitle('reply', 'Lan', 'React')).toBe('Lan đã trả lời bình luận của bạn trong "React"');
    expect(commentLink('react', 'r')).toBe('/blog/react?comment=r');
    expect(commentLink('react', 'r', 'c')).toBe('/blog/react?comment=r&reply=c');
    expect(excerptLine('a\n\n b')).toBe('a b');
    expect(excerptLine('x'.repeat(100))).toHaveLength(80);
  });
});
