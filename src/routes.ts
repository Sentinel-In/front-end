export const ROUTES = {
  root: '/',
  dashboard: '/dashboard',
  approvals: '/approvals',
  approvalDetail: '/approvals/:approvalId',
  brief: '/brief',
  briefNew: '/brief/new',
  briefDetail: '/brief/:briefId',
  triage: '/triage',
  tickets: '/tickets',
  ticketDetail: '/tickets/:ticketId',
  tasks: '/tasks',
  taskDetail: '/tasks/:ticketId',
  history: '/history',
  audit: '/audit',
  auditCase: '/audit/:caseId',
  alerts: '/alerts',
  evidence: '/evidence',
  evidenceCase: '/evidence/:caseId',
  gaps: '/gaps',
  gapsCase: '/gaps/:caseId',
  recommendCase: '/recommend/:caseId',
  assetImpact: '/reports/asset-impact',
  assetImpactCase: '/reports/asset-impact/:caseId',
  settings: '/settings',
  notFound: '*',
} as const;

export type RoutePattern = (typeof ROUTES)[keyof typeof ROUTES];

export const REGISTERED_ROUTE_PATTERNS = Object.freeze(
  Object.values(ROUTES).filter((route) => route !== ROUTES.notFound),
);

function routePatternToRegExp(pattern: string): RegExp {
  const expression = pattern
    .split('/')
    .map((segment) => segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('/');
  return new RegExp(`^${expression}$`);
}

export function isRegisteredRoute(route: string): boolean {
  return REGISTERED_ROUTE_PATTERNS.some((pattern) => routePatternToRegExp(pattern).test(route));
}

export function assertRegisteredRoute(label: string, route: string): void {
  if (!isRegisteredRoute(route)) {
    throw new Error(`${label}: ${route} is not registered in the route manifest`);
  }
}

export function withCaseId(pattern: RoutePattern, caseId: string): string {
  if (!pattern.includes(':caseId')) {
    throw new Error(`${pattern} is not a case-scoped route`);
  }
  return pattern.replace(':caseId', encodeURIComponent(caseId));
}
