export default function loadPois(lat, lng, distance = 5000, language, addLineBreaks, onlyNearest) {
  const query = `[out:json][timeout:25];
    (
      node["natural"="peak"](around:${distance},${lat},${lng});
      node["place"~"city|town|village|suburb"](around:${distance},${lat},${lng});
      way["natural"="water"](around:${distance},${lat},${lng});
      relation["natural"="water"](around:${distance},${lat},${lng});
      way["landuse"="reservoir"](around:${distance},${lat},${lng});
      relation["landuse"="reservoir"](around:${distance},${lat},${lng});
      way["waterway"="dam"](around:${distance},${lat},${lng});
    );
    out center;`;

  const nf = typeof Intl !== 'undefined' ? new Intl.NumberFormat(language, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) : null;

  function formatEle(e) {
    return nf ? nf.format(e) : e;
  }

  return fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query)
  }).then(res => res.json()).then(data => {
    let items = data.elements;
    items.filter(item => item.center).forEach(item => { item.lat = item.center.lat; item.lon = item.center.lon; });
    if (onlyNearest && items.length > 1) {
      const center = L.latLng(lat, lng);
      const distances = items.map(({ lat, lon: lng }) => L.latLng(lat, lng).distanceTo(center));
      const min = distances.reduce((a, b) => Math.min(a, b));
      items = [ items[distances.indexOf(min)] ];
    }
    return items.map(({ id, lat, lon, tags: { name, ele } }) =>
      ({ id, lat, lng: lon, observer: false, flipText: false,
        text: `${name || '???'}${ele ? ` (${formatEle(ele)} m)` : ''}${addLineBreaks ? '\n' : ', '}{d} km` }))
  });
}
