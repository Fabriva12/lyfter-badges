export interface ShareTarget {
  x: string;
  whatsapp: string;
  facebook: string;
  linkedin: string;
}

function badgeWord(total: number): string {
  return total === 1 ? "insignia" : "insignias";
}

export function buildShareText(input: {
  badgeName: string;
  eventName: string;
  xp: number;
}): string {
  return `Recolecté la insignia ${input.badgeName} en ${input.eventName} (+${input.xp} XP) con Lyfter Badges.`;
}

export function buildCollectionShareText(input: {
  attendeeName: string;
  eventName: string;
  collected: number;
  total: number;
  xp: number;
}): string {
  return `${input.attendeeName} recolectó ${input.collected} de ${input.total} ${badgeWord(input.total)} en ${input.eventName} (${input.xp} XP) con Lyfter Badges.`;
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
