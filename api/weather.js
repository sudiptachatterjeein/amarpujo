module.exports = async function handler(req, res) {
  const lat = Number(req.query.lat || 22.5726);
  const lon = Number(req.query.lon || 88.3639);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const forecastUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day' +
    '&hourly=temperature_2m,precipitation_probability,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset' +
    '&timezone=Asia%2FKolkata&forecast_days=16';
  const airUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon +
    '&current=us_aqi,pm2_5&timezone=Asia%2FKolkata';

  try {
    const [forecastResponse, airResponse] = await Promise.all([
      fetch(forecastUrl),
      fetch(airUrl).catch(() => null)
    ]);
    if (!forecastResponse.ok) {
      throw new Error('Weather provider HTTP ' + forecastResponse.status);
    }
    const forecast = await forecastResponse.json();
    const air = airResponse && airResponse.ok ? await airResponse.json() : null;
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ forecast, air });
  } catch (err) {
    return res.status(502).json({ error: 'Weather service unavailable' });
  }
}
