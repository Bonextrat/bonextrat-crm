export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { city, radius = 5000 } = req.query;
  if (!city) { res.status(400).json({ error: 'city required' }); return; }

  try {
    // 1. Geocode
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=fr`,
      { headers: { 'User-Agent': 'BonextratCRM/1.0' } }
    );
    const geoData = await geoRes.json();
    if (!geoData.length) { res.status(404).json({ error: 'Ville introuvable' }); return; }
    const { lat, lon } = geoData[0];

    // 2. Overpass
    const q = `[out:json][timeout:25];(node["tourism"="hotel"](around:${radius},${lat},${lon});way["tourism"="hotel"](around:${radius},${lat},${lon}););out center tags;`;
    const ovRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BonextratCRM/1.0' },
      body: 'data=' + encodeURIComponent(q)
    });
    const ovData = await ovRes.json();

    res.status(200).json({ hotels: ovData.elements || [], lat, lon });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
