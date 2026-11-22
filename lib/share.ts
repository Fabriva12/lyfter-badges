export interface ShareTarget {
  x: string;
  whatsapp: string;
  facebook: string;
  linkedin: string;
}

function badgeWord(total: number): string {
  return total === 1 ? "badge" : "badges";
}

export function buildShareText(input: {
  badgeName: string;
  eventName: string;
  xp: number;
}): string {
  return `I collected the ${input.badgeName} badge at ${input.eventName} (+${input.xp} XP) with Lyfter Badges.`;
}

export function buildCollectionShareText(input: {
  attendeeName: string;
  eventName: string;
  collected: number;
  total: number;
  xp: number;
}): string {
  return `${input.attendeeName} collected ${input.collected} of ${input.total} ${badgeWord(input.total)} at ${input.eventName} (${input.xp} XP) with Lyfter Badges.`;
}

export function buildShareUrls(input: {
  url: string;
  text: string;
}): ShareTarget {
  const encodedUrl = encodeURIComponent(input.url);
  const encodedText = encodeURIComponent(input.text);

  return {
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${input.text} ${input.url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}
