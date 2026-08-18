import { useEffect, useState } from 'react';

// Hash routing keeps every page on its own URL — so the browser's back
// button and a refresh both work — without needing any server-side rewrite
// rules for the static build.

export function currentPath() {
  const raw = window.location.hash.replace(/^#/, '');
  return raw.startsWith('/') ? raw : '/';
}

export function navigate(path) {
  if (currentPath() === path) return;
  window.location.hash = path;
}

export const paths = {
  home: () => '/',
  category: (category) => (category === 'study' ? '/studies' : '/goals'),
  subject: (subjectId) => `/subject/${subjectId}`,
  paper: (subjectId, paper) => `/subject/${subjectId}/${encodeURIComponent(paper)}`,
  pastPapers: (subjectId, paper) => `/subject/${subjectId}/${encodeURIComponent(paper)}/past-papers`,
  pastPaper: (subjectId, paper, pastPaperId) =>
    `/subject/${subjectId}/${encodeURIComponent(paper)}/past-papers/${pastPaperId}`,
  report: (subjectId) => `/report/${subjectId}`,
};

export function parseRoute(path) {
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  const [first, second, third, fourth, fifth] = segments;

  if (!first) return { name: 'home' };
  if (first === 'studies') return { name: 'dashboard', category: 'study' };
  if (first === 'goals') return { name: 'dashboard', category: 'general' };
  if (first === 'report' && second) return { name: 'reportDetail', subjectId: second };
  if (first === 'subject' && second) {
    if (!third) return { name: 'subject', subjectId: second };
    if (fourth === 'past-papers') {
      return fifth
        ? { name: 'pastPaper', subjectId: second, paper: third, pastPaperId: fifth }
        : { name: 'pastPapers', subjectId: second, paper: third };
    }
    return { name: 'paper', subjectId: second, paper: third };
  }
  return { name: 'home' };
}

// The parent page each route returns to, used by the header's back arrow.
export function parentPath(route) {
  switch (route.name) {
    case 'dashboard':
      return paths.home();
    case 'reportDetail':
      return paths.home();
    case 'subject':
      return null; // resolved by the caller, which knows the subject's category
    case 'paper':
      return paths.subject(route.subjectId);
    case 'pastPapers':
      return paths.paper(route.subjectId, route.paper);
    case 'pastPaper':
      return paths.pastPapers(route.subjectId, route.paper);
    default:
      return null;
  }
}

export function useRoute() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onHashChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return parseRoute(path);
}