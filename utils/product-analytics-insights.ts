type FeedSessionEvent = {
  created_at: string;
  event_name: string;
  id: string;
  metadata: unknown;
  session_id: string | null;
  user_id: string | null;
  visitor_id: string | null;
};

export type FeedSessionInsight = {
  backwardFeedSwipes: number;
  createdAt: string;
  dogsViewed: number;
  durationSeconds: number;
  feedVisitId: string;
  forwardFeedSwipes: number;
  reachedEnd: boolean;
  sessionId: string | null;
  totalFeedSwipes: number;
  totalDogs: number;
  userId: string | null;
  viewerKey: string;
  visitorId: string | null;
};

export type FeedSessionSummary = {
  averageFeedSwipes: number;
  averageDogsViewed: number;
  averageDurationSeconds: number;
  completionRate: number;
  depthBuckets: Array<{ count: number; label: string }>;
  earlyExitRate: number;
  medianDogsViewed: number;
  sessions: FeedSessionInsight[];
};

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function boundedNumber(value: unknown, maximum = 100_000) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), maximum);
}

function oneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return oneDecimal(values.reduce((total, value) => total + value, 0) / values.length);
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? oneDecimal((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function eventViewerKey(event: FeedSessionEvent) {
  if (event.user_id) return `user:${event.user_id}`;
  if (event.visitor_id) return `visitor:${event.visitor_id}`;
  if (event.session_id) return `session:${event.session_id}`;
  return `event:${event.id}`;
}

function parseFeedSession(event: FeedSessionEvent): FeedSessionInsight | null {
  if (event.event_name !== "feed_session_summary") return null;
  const metadata = metadataObject(event.metadata);
  const feedVisitId = typeof metadata.feedVisitId === "string" && metadata.feedVisitId.length <= 100
    ? metadata.feedVisitId
    : event.id;
  const dogsViewed = boundedNumber(metadata.dogsViewed, 10_000);
  const forwardFeedSwipes = boundedNumber(metadata.forwardFeedSwipes);
  const backwardFeedSwipes = boundedNumber(metadata.backwardFeedSwipes);
  const recordedFeedSwipes = boundedNumber(metadata.totalFeedSwipes);

  return {
    backwardFeedSwipes,
    createdAt: event.created_at,
    dogsViewed,
    durationSeconds: boundedNumber(metadata.durationSeconds, 86_400),
    feedVisitId,
    forwardFeedSwipes,
    reachedEnd: metadata.reachedEnd === true,
    sessionId: event.session_id,
    totalFeedSwipes: recordedFeedSwipes || forwardFeedSwipes + backwardFeedSwipes || Math.max(dogsViewed - 1, 0),
    totalDogs: boundedNumber(metadata.totalDogs, 10_000),
    userId: event.user_id,
    viewerKey: eventViewerKey(event),
    visitorId: event.visitor_id,
  };
}

export function summarizeFeedSessions(events: FeedSessionEvent[]): FeedSessionSummary {
  const latestByVisit = new Map<string, FeedSessionInsight>();

  for (const event of events) {
    const parsed = parseFeedSession(event);
    if (!parsed) continue;
    const current = latestByVisit.get(parsed.feedVisitId);
    if (!current || new Date(parsed.createdAt).getTime() > new Date(current.createdAt).getTime()) {
      latestByVisit.set(parsed.feedVisitId, parsed);
    }
  }

  const sessions = [...latestByVisit.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const earlyExits = sessions.filter((session) => !session.reachedEnd && session.dogsViewed <= 3).length;
  const completed = sessions.filter((session) => session.reachedEnd).length;
  const depthBuckets = [
    { count: sessions.filter((session) => session.dogsViewed <= 1).length, label: "1 dog" },
    { count: sessions.filter((session) => session.dogsViewed >= 2 && session.dogsViewed <= 3).length, label: "2-3 dogs" },
    { count: sessions.filter((session) => session.dogsViewed >= 4 && session.dogsViewed <= 7).length, label: "4-7 dogs" },
    { count: sessions.filter((session) => session.dogsViewed >= 8).length, label: "8+ dogs" },
  ];

  return {
    averageFeedSwipes: average(sessions.map((session) => session.totalFeedSwipes)),
    averageDogsViewed: average(sessions.map((session) => session.dogsViewed)),
    averageDurationSeconds: average(sessions.map((session) => session.durationSeconds)),
    completionRate: percentage(completed, sessions.length),
    depthBuckets,
    earlyExitRate: percentage(earlyExits, sessions.length),
    medianDogsViewed: median(sessions.map((session) => session.dogsViewed)),
    sessions,
  };
}
