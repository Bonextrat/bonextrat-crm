export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q } = req.query;
  if (!q) { res.status(400).json({ error: 'q required' }); return; }
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+' hotel france')}&format=json&limit=15&accept-language=fr&addressdetails=1&countrycodes=fr`,
      { headers: { 'User-Agent': 'BonextratCRM/1.0' } }
    );
    const data = await r.json();
    res.status(200).json({ results: data.slice(0,15) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
