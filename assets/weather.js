/* Puja Map 2026 - live Kolkata weather (Open-Meteo: free, no API key) */
(function (PM) {
  'use strict';
  var KEY = 'puja26_wx_v1', TTL = 10 * 60 * 1000;
  PM.wx = { data: null, status: 'idle', error: '' };       // status: idle | loading | ok | stale | error

  function getJson(url, ms) {
    var c = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var to = setTimeout(function () { if (c) c.abort(); }, ms || 9000);
    return fetch(url, c ? { signal: c.signal } : undefined).then(function (r) {
      clearTimeout(to);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function (e) { clearTimeout(to); throw e; });
  }

  var istMs = function (s) { return Date.parse(s + (s.length === 16 ? ':00' : '') + '+05:30'); };

  /* Normalise the two API responses into one small object the UI can use. */
  PM.parseWeather = function (f, a) {
    var c = f.current, h = f.hourly, d = f.daily;
    var nowHour = c.time.slice(0, 13) + ':00';
    var idx = h.time.indexOf(nowHour); if (idx < 0) idx = 0;
    var hours = [];
    for (var i = idx; i < Math.min(h.time.length, idx + 24); i++) {
      hours.push({ ts: istMs(h.time[i]), temp: h.temperature_2m[i], pop: h.precipitation_probability ? h.precipitation_probability[i] : null, code: h.weather_code[i] });
    }
    var days = d.time.map(function (day, k) {
      return {
        date: day, ts: istMs(day + 'T00:00'), code: d.weather_code[k], max: d.temperature_2m_max[k], min: d.temperature_2m_min[k],
        pop: d.precipitation_probability_max ? d.precipitation_probability_max[k] : null,
        sunrise: d.sunrise ? istMs(d.sunrise[k]) : null, sunset: d.sunset ? istMs(d.sunset[k]) : null
      };
    });
    var aqi = null;
    if (a && a.current && a.current.us_aqi != null) aqi = { us: Math.round(a.current.us_aqi), pm25: a.current.pm2_5 };
    return {
      now: { temp: c.temperature_2m, feels: c.apparent_temperature, hum: c.relative_humidity_2m, wind: c.wind_speed_10m, code: c.weather_code, isDay: c.is_day === 1, precip: c.precipitation, ts: istMs(c.time) },
      hours: hours, days: days, aqi: aqi, fetched: Date.now()
    };
  };

  PM.loadWeather = function (force) {
    var cached = PM.store.json(KEY, null);
    if (cached && cached.data && !PM.wx.data) { PM.wx.data = cached.data; PM.wx.status = 'stale'; }
    if (!force && cached && cached.data && Date.now() - cached.data.fetched < TTL) {
      PM.wx.data = cached.data; PM.wx.status = 'ok'; return Promise.resolve(PM.wx.data);
    }
    PM.wx.status = PM.wx.data ? 'stale' : 'loading';
    if (PM.onWeather) PM.onWeather();
    var lat = PM.CFG.WEATHER_LAT, lon = PM.CFG.WEATHER_LON;
    var url = '/api/weather?lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon);
    return getJson(url).then(function (r) {
      PM.wx.data = PM.parseWeather(r.forecast, r.air); PM.wx.status = 'ok'; PM.wx.error = '';
      PM.store.set(KEY, JSON.stringify({ data: PM.wx.data }));
      if (PM.onWeather) PM.onWeather();
      return PM.wx.data;
    }).catch(function (e) {
      PM.wx.error = String(e && e.message || e);
      PM.wx.status = PM.wx.data ? 'stale' : 'error';
      if (PM.onWeather) PM.onWeather();
      return null;
    });
  };

  /* ---------- condition mapping (WMO weather codes) ---------- */
  PM.wxKind = function (code, isDay) {
    if (code === 0 || code === 1) return isDay ? 'sun' : 'moon';
    if (code === 2) return isDay ? 'psun' : 'pmoon';
    if (code === 3) return 'cloud';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code >= 95) return 'storm';
    return 'cloud';
  };
  PM.wxLabelKey = function (code) {
    if (code === 0) return 'wx_clear'; if (code === 1) return 'wx_mclear'; if (code === 2) return 'wx_pcloud'; if (code === 3) return 'wx_cloud';
    if (code === 45 || code === 48) return 'wx_fog';
    if (code >= 51 && code <= 57) return 'wx_drizzle';
    if (code === 65 || code === 67 || code === 82) return 'wx_heavy';
    if (code >= 80 && code <= 81) return 'wx_showers';
    if (code >= 61 && code <= 66) return 'wx_rain';
    if (code >= 95) return 'wx_storm';
    return 'wx_cloud';
  };
  /* sky class for the hero card background */
  PM.wxSky = function (code, isDay) {
    var k = PM.wxKind(code, isDay);
    if (k === 'storm') return 'sky-storm'; if (k === 'rain' || k === 'drizzle') return 'sky-rain'; if (k === 'fog') return 'sky-fog';
    if (k === 'cloud') return isDay ? 'sky-cloud' : 'sky-night-cloud';
    return isDay ? 'sky-day' : 'sky-night';
  };

  /* Coloured weather icons (48x48). */
  var CLOUD = 'M14 36a8 8 0 0 1-1.2-15.9A11 11 0 0 1 34 17.5a9.2 9.2 0 0 1 .8 18.5z';
  var SUN = '<circle cx="24" cy="24" r="8" fill="#FFC93C"/><g stroke="#FFC93C" stroke-width="3" stroke-linecap="round"><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M36.7 11.3l-3.5 3.5M14.8 33.2l-3.5 3.5"/></g>';
  var MOON = '<path d="M36 28.5A13 13 0 1 1 19.5 12a10.5 10.5 0 0 0 16.5 16.5z" fill="#E9E5FF"/>';
  PM.wxIcon = function (kind, size) {
    var s = size || 48, b;
    switch (kind) {
      case 'sun': b = SUN; break;
      case 'moon': b = MOON; break;
      case 'psun': b = '<g transform="translate(-1 -5) scale(.7)">' + SUN + '</g><path d="' + CLOUD + '" fill="#D9D3FA"/>'; break;
      case 'pmoon': b = '<g transform="translate(-1 -6) scale(.66)">' + MOON + '</g><path d="' + CLOUD + '" fill="#C9C2F2"/>'; break;
      case 'fog': b = '<path d="' + CLOUD + '" fill="#B9B3DC" transform="translate(0 -4)"/><g stroke="#D9D3FA" stroke-width="3" stroke-linecap="round"><path d="M10 38h28M14 44h20"/></g>'; break;
      case 'drizzle': b = '<path d="' + CLOUD + '" fill="#B9B3DC" transform="translate(0 -5)"/><g stroke="#7DB2FF" stroke-width="3" stroke-linecap="round"><path d="M16 36l-1.5 4M24 36l-1.5 4M32 36l-1.5 4"/></g>'; break;
      case 'rain': b = '<path d="' + CLOUD + '" fill="#A39DD0" transform="translate(0 -5)"/><g stroke="#6AA3FF" stroke-width="3.2" stroke-linecap="round"><path d="M15 36l-2.5 7M24 36l-2.5 7M33 36l-2.5 7"/></g>'; break;
      case 'storm': b = '<path d="' + CLOUD + '" fill="#8F88C4" transform="translate(0 -6)"/><path d="M25 28l-6 9h5l-2 7 8-11h-5z" fill="#FFC93C"/>'; break;
      default: b = '<path d="' + CLOUD + '" fill="#D9D3FA"/>';
    }
    return '<svg class="wxi" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true">' + b + '</svg>';
  };

  /* ---------- AQI ---------- */
  PM.aqiInfo = function (v) {
    if (v <= 50) return { key: 'aqi_good', c: '#3DDC97' };
    if (v <= 100) return { key: 'aqi_mod', c: '#FFD24C' };
    if (v <= 150) return { key: 'aqi_sens', c: '#FF9F43' };
    if (v <= 200) return { key: 'aqi_bad', c: '#FF6B6B' };
    if (v <= 300) return { key: 'aqi_vbad', c: '#C77DFF' };
    return { key: 'aqi_haz', c: '#C0392B' };
  };

  /* ---------- plain-language advice for the next hours ---------- */
  PM.wxAdvice = function () {
    var w = PM.wx.data; if (!w) return null;
    var next = w.hours.slice(0, 7), maxPop = 0, firstRain = null, storm = false;
    next.forEach(function (h) {
      if (h.pop != null && h.pop > maxPop) maxPop = h.pop;
      if (h.pop != null && h.pop >= 50 && !firstRain) firstRain = h;
      if (h.code >= 95) storm = true;
    });
    var raining = w.now.precip > 0.1 || (w.now.code >= 51 && w.now.code <= 82) || w.now.code >= 95;
    if (storm || w.now.code >= 95) return { tone: 'bad', key: 'wx_adv_storm' };
    if (raining) return { tone: 'warn', key: 'wx_adv_raining' };
    if (firstRain) return { tone: 'warn', key: 'wx_adv_rain_at', vars: { time: PM.fmtHour(firstRain.ts), pop: PM.nf(firstRain.pop) } };
    if (maxPop >= 30) return { tone: 'mid', key: 'wx_adv_maybe', vars: { pop: PM.nf(maxPop) } };
    if (w.now.feels >= 38) return { tone: 'warn', key: 'wx_adv_hot' };
    return { tone: 'good', key: 'wx_adv_dry' };
  };

  PM.degree = function (v) { return PM.nf(Math.round(v)) + '°'; };
})(window.PM = window.PM || {});
