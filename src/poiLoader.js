  module.exports = function loadPeaks(lat, lng, distance = 5000, language) {
  const query = `[out:json][timeout:25]; ( node["natural"="peak"] (around:${distance},${lat},${lng}); ); out body; >; out skel qt;`;

  const nf = typeof Intl !== 'undefined' ? new Intl.NumberFormat(language, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) : null;

  function formatEle(e) {
    return nf ? nf.format(e) : e;
  }

  return fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query)
  }).then(res => res.json()).then(data => {
    return data.elements.map(({ id, lat, lon, tags: { name, ele } }) => ({ id, lat, lng: lon, text: `${name || '???'} ${formatEle(ele) || '???'} m, {d} km`, observer: false }));
  });
}
