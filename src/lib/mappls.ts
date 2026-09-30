/** Mappls shows the Survey of India boundary. These pages open without an API key. */

export function mapplsPinUrl(lat: number, lng: number): string {
  return `https://www.mappls.com/pom/${lat},${lng}`;
}

export function mapplsDirectionUrl(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): string {
  return `https://www.mappls.com/direction?places=${from.lat},${from.lng};${to.lat},${to.lng}`;
}
