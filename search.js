export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { city, radius = 5000, q } = req.query;

  // Geocode by name search
  if (q) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+' hotel')}&format=json&limit=20&accept-language=fr&addressdetails=1&countrycodes=fr`,
        { headers: { 'User-Agent': 'BonextratCRM/1.0' } }
      );
      const data = await r.json();
      const hotels = data.filter(d => d.type === 'hotel' || d.class === 'tourism' || d.display_name.toLowerCase().includes('hotel') || d.display_name.toLowerCase().includes('hôtel'));
      res.status(200).json({ results: hotels.slice(0,20) });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (!city) { res.status(400).json({ error: 'city required' }); return; }

  try {
    // 1. Geocode
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=fr`,
      { headers: { 'User-Agent': 'BonextratCRM/1.0' } }
    );
    const geoData = await geoRes.json();
    if (!geoData.length) { res.status(404).json({ error: 'Ville introuvable. Essaie : Paris, Lyon, Marseille…' }); return; }
    const { lat, lon } = geoData[0];

    // 2. Overpass
    const ovQ = `[out:json][timeout:25];(node["tourism"="hotel"](around:${radius},${lat},${lon});way["tourism"="hotel"](around:${radius},${lat},${lon}););out center tags;`;
    const ovRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BonextratCRM/1.0' },
      body: 'data=' + encodeURIComponent(ovQ)
    });
    const ovData = await ovRes.json();
    res.status(200).json({ hotels: ovData.elements || [], lat, lon });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
