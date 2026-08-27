import { NextResponse } from 'next/server';

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const p1Lat = Number(lat1);
  const p1Lon = Number(lon1);
  const p2Lat = Number(lat2);
  const p2Lon = Number(lon2);
  if (isNaN(p1Lat) || isNaN(p1Lon) || isNaN(p2Lat) || isNaN(p2Lon)) return null;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((p2Lat - p1Lat) * Math.PI) / 180;
  const dLon = ((p2Lon - p1Lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1Lat * Math.PI) / 180) *
      Math.cos((p2Lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const storeLat = searchParams.get('store_lat') ? parseFloat(searchParams.get('store_lat')) : null;
    const storeLng = searchParams.get('store_lng') ? parseFloat(searchParams.get('store_lng')) : null;
    const radiusKm = searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')) : null;
    const restrictRadius = searchParams.get('restrict_radius') === 'true';
    const rawServiceableAreas = searchParams.get('serviceable_areas') || 'Anwak, Sirsa, Khalispur, Nizamabad';

    const headers = {
      'User-Agent': 'NFC-Nawab-Sahab-Store/1.0 (admin@thenawabsahab.com)',
      'Accept-Language': 'en',
    };

    // Reverse Geocoding
    if (lat && lng) {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers, next: { revalidate: 3600 } });
      const data = await res.json();
      return NextResponse.json({ success: true, data });
    }

    // Forward Search (Villages, Towns, Cities, Localities)
    if (query && query.trim()) {
      const cleanQ = query.trim().toLowerCase();
      const results = [];
      const seen = new Set();

      // 1. Direct Matching against Configured Serviceable Local Villages & Areas
      if (rawServiceableAreas && storeLat !== null && storeLng !== null) {
        const areaList = rawServiceableAreas.split(',').map((s) => s.trim()).filter(Boolean);
        areaList.forEach((areaName, index) => {
          const areaLower = areaName.toLowerCase();
          if (areaLower.includes(cleanQ) || cleanQ.includes(areaLower)) {
            const key = `local_${areaLower}`;
            if (!seen.has(key)) {
              seen.add(key);
              // Calculate slight offset or 0.0 for main store village
              const isMainStore = areaLower.includes('anwak');
              const estimatedDist = isMainStore ? 0.0 : Math.min(Number((0.8 + index * 0.6).toFixed(1)), radiusKm ? radiusKm * 0.8 : 2.5);
              const angle = (index * 60 * Math.PI) / 180;
              const dLat = (estimatedDist / 111) * Math.cos(angle);
              const dLng = (estimatedDist / (111 * Math.cos((storeLat * Math.PI) / 180))) * Math.sin(angle);

              results.push({
                display_name: `${areaName}, Serviceable Delivery Area (${isMainStore ? 'Restaurant Location' : 'Local Zone'})`,
                lat: isMainStore ? storeLat : storeLat + dLat,
                lon: isMainStore ? storeLng : storeLng + dLng,
                distance_km: estimatedDist,
                type: 'village',
                is_local_village: true,
              });
            }
          }
        });
      }

      // Build bounding box if store location is available
      let viewboxParam = '';
      if (storeLat !== null && storeLng !== null && radiusKm) {
        const dLat = (radiusKm * 1.5) / 111;
        const dLng = (radiusKm * 1.5) / (111 * Math.cos((storeLat * Math.PI) / 180));
        viewboxParam = `&viewbox=${(storeLng - dLng).toFixed(5)},${(storeLat + dLat).toFixed(5)},${(storeLng + dLng).toFixed(5)},${(storeLat - dLat).toFixed(5)}`;
      }

      // 2. Search Nominatim (with local district biasing)
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=10&addressdetails=1${viewboxParam}`;
        const nomRes = await fetch(nomUrl, { headers });
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          nomData.forEach((item) => {
            const itemLat = parseFloat(item.lat);
            const itemLon = parseFloat(item.lon);
            const key = `${itemLat.toFixed(3)},${itemLon.toFixed(3)}`;
            if (!seen.has(key)) {
              seen.add(key);
              const dist = (storeLat !== null && storeLng !== null)
                ? haversineDistance(storeLat, storeLng, itemLat, itemLon)
                : null;

              results.push({
                display_name: item.display_name,
                lat: itemLat,
                lon: itemLon,
                distance_km: dist,
                type: item.type || item.class || 'location',
              });
            }
          });
        }
      } catch (e) {
        console.warn('Nominatim forward error:', e);
      }

      // 3. Search Photon API (with location biasing)
      try {
        let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=10`;
        if (storeLat !== null && storeLng !== null) {
          photonUrl += `&lat=${storeLat}&lon=${storeLng}`;
        }
        const photonRes = await fetch(photonUrl);
        const photonData = await photonRes.json();
        if (photonData?.features) {
          photonData.features.forEach((feat) => {
            const p = feat.properties || {};
            const coords = feat.geometry?.coordinates || [];
            if (coords.length >= 2) {
              const itemLon = coords[0];
              const itemLat = coords[1];
              const key = `${itemLat.toFixed(3)},${itemLon.toFixed(3)}`;
              if (!seen.has(key)) {
                seen.add(key);
                const parts = [
                  p.name,
                  p.street,
                  p.district || p.county,
                  p.city,
                  p.state,
                ].filter(Boolean);

                const dist = (storeLat !== null && storeLng !== null)
                  ? haversineDistance(storeLat, storeLng, itemLat, itemLon)
                  : null;

                results.push({
                  display_name: parts.join(', '),
                  lat: itemLat,
                  lon: itemLon,
                  distance_km: dist,
                  type: p.type || 'place',
                });
              }
            }
          });
        }
      } catch (e) {
        console.warn('Photon forward error:', e);
      }

      // 4. Filter strictly by serviceable radius if restrictRadius is enabled
      let filteredResults = results;
      if (restrictRadius && storeLat !== null && storeLng !== null && radiusKm) {
        filteredResults = results.filter((item) => {
          return item.is_local_village || (item.distance_km !== null && item.distance_km <= radiusKm);
        });
      }

      // Sort by proximity to store (local matches always first)
      if (storeLat !== null && storeLng !== null) {
        filteredResults.sort((a, b) => {
          if (a.is_local_village && !b.is_local_village) return -1;
          if (!a.is_local_village && b.is_local_village) return 1;
          return (a.distance_km ?? 9999) - (b.distance_km ?? 9999);
        });
      }

      return NextResponse.json({
        success: true,
        data: filteredResults,
        totalFound: filteredResults.length,
        radiusRestricted: restrictRadius,
      });
    }

    return NextResponse.json({ success: false, message: 'Query or coordinates required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Geocoding failed' }, { status: 500 });
  }
}
