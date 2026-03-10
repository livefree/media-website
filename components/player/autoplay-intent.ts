"use client";

const AUTOPLAY_INTENT_KEY = "player-episodic-autoplay-intent";

type WatchIdentity = {
  mediaPublicId?: string;
  episodePublicId?: string;
  listPublicId?: string;
  listItemPublicRef?: string;
};

type AutoplayIntent = WatchIdentity & {
  autoplay: true;
  createdAt: number;
};

function getWindowUrl(href?: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return new URL(href ?? window.location.href, window.location.origin);
}

export function parseWatchIdentityFromHref(href?: string): WatchIdentity | null {
  const url = getWindowUrl(href);
  if (!url) {
    return null;
  }

  return {
    mediaPublicId: url.searchParams.get("v") ?? undefined,
    episodePublicId: url.searchParams.get("e") ?? undefined,
    listPublicId: url.searchParams.get("list") ?? undefined,
    listItemPublicRef: url.searchParams.get("li") ?? undefined,
  };
}

function matchesIdentity(intent: WatchIdentity, current: WatchIdentity) {
  return (
    intent.mediaPublicId === current.mediaPublicId &&
    intent.episodePublicId === current.episodePublicId &&
    intent.listPublicId === current.listPublicId &&
    intent.listItemPublicRef === current.listItemPublicRef
  );
}

export function setAutoplayIntentForHref(href: string) {
  if (typeof window === "undefined") {
    return;
  }

  const identity = parseWatchIdentityFromHref(href);
  if (!identity?.mediaPublicId) {
    return;
  }

  const intent: AutoplayIntent = {
    ...identity,
    autoplay: true,
    createdAt: Date.now(),
  };

  window.sessionStorage.setItem(AUTOPLAY_INTENT_KEY, JSON.stringify(intent));
}

export function consumeAutoplayIntentForHref(href?: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.sessionStorage.getItem(AUTOPLAY_INTENT_KEY);
  window.sessionStorage.removeItem(AUTOPLAY_INTENT_KEY);

  if (!raw) {
    return false;
  }

  try {
    const intent = JSON.parse(raw) as AutoplayIntent;
    const currentIdentity = parseWatchIdentityFromHref(href);
    if (!intent.autoplay || !currentIdentity?.mediaPublicId) {
      return false;
    }

    return matchesIdentity(intent, currentIdentity);
  } catch {
    return false;
  }
}
