// URL theo Udemy: /courses/<cấp 1>/<cấp 2>, /topic/<slug>. Chi tiết khoá ở /course/<slug>.
export function categoryHref(l1: string, l2?: string): string {
  return l2 ? `/courses/${l1}/${l2}` : `/courses/${l1}`;
}

export function topicHref(slug: string): string {
  return `/topic/${slug}`;
}
