export interface CrimeZone {
  id: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  riskLevel: 'high' | 'medium' | 'low';
  type: string;
  description: string;
}

export const MOCK_CRIME_ZONES: CrimeZone[] = [
  {
    id: '1',
    lat: 12.9716,
    lng: 77.5946,
    radius: 500,
    riskLevel: 'high',
    type: 'Theft',
    description: 'Frequent reports of petty theft in this area after 8 PM.'
  },
  {
    id: '2',
    lat: 12.9800,
    lng: 77.6000,
    radius: 400,
    riskLevel: 'medium',
    type: 'Harassment',
    description: 'Isolated street with poor lighting.'
  },
  {
    id: '3',
    lat: 12.9650,
    lng: 77.5850,
    radius: 600,
    riskLevel: 'high',
    type: 'Robbery',
    description: 'High risk zone during late night hours.'
  },
  {
    id: '4',
    lat: 12.9100,
    lng: 77.4800, // Near Kengeri
    radius: 700,
    riskLevel: 'medium',
    type: 'Isolated Area',
    description: 'Low foot traffic area.'
  },
  {
    id: '5',
    lat: 12.9750,
    lng: 77.6100, // Near MG Road
    radius: 300,
    riskLevel: 'low',
    type: 'Crowded',
    description: 'Generally safe but watch out for pickpockets.'
  }
];

interface LatLngLiteral {
  lat: number;
  lng: number;
}

export type JourneyStatus = 'SAFE' | 'SUSPICIOUS' | 'DANGER';

export const calculateSafetyScore = (routePoints: LatLngLiteral[]): number => {
  let totalRisk = 0;
  
  routePoints.forEach(point => {
    MOCK_CRIME_ZONES.forEach(zone => {
      const distance = getDistance(point, { lat: zone.lat, lng: zone.lng });
      if (distance < zone.radius) {
        const weight = zone.riskLevel === 'high' ? 10 : zone.riskLevel === 'medium' ? 5 : 2;
        totalRisk += weight * (1 - distance / zone.radius);
      }
    });
  });

  // Normalize score to 0-100
  const score = Math.max(0, 100 - (totalRisk / routePoints.length) * 20);
  return Math.round(score);
};

export const getDistance = (p1: LatLngLiteral, p2: LatLngLiteral): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Calculate shortest distance from a point to a polyline
export const getDistanceFromRoute = (point: LatLngLiteral, route: LatLngLiteral[]): number => {
  let minDistance = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const dist = distToSegment(point, route[i], route[i + 1]);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
};

const distToSegment = (p: LatLngLiteral, v: LatLngLiteral, w: LatLngLiteral): number => {
  const l2 = Math.pow(getDistance(v, w), 2);
  if (l2 === 0) return getDistance(p, v);
  let t = ((p.lat - v.lat) * (w.lat - v.lat) + (p.lng - v.lng) * (w.lng - v.lng)) / l2;
  t = Math.max(0, Math.min(1, t));
  return getDistance(p, {
    lat: v.lat + t * (w.lat - v.lat),
    lng: v.lng + t * (w.lng - v.lng)
  });
};

export const classifyJourneyRisk = (
  deviation: number,
  timeOffRoute: number,
  currentPos: LatLngLiteral
): JourneyStatus => {
  const isInHighRiskZone = MOCK_CRIME_ZONES.some(
    zone => zone.riskLevel === 'high' && getDistance(currentPos, { lat: zone.lat, lng: zone.lng }) < zone.radius
  );

  if (deviation > 500 && timeOffRoute > 120 && isInHighRiskZone) {
    return 'DANGER';
  }
  if (deviation > 300 || (deviation > 200 && isInHighRiskZone)) {
    return 'SUSPICIOUS';
  }
  return 'SAFE';
};
