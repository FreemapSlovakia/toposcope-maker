module.exports = function loadPeaks(lat, lng, distance = 5000) {
  const query = `[out:json][timeout:25]; ( node["natural"="peak"] (around:${distance},${lat},${lng}); ); out body; >; out skel qt;`;

  return fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query)
  }).then(res => res.json()).then(data => {
    return data.elements.filter(({ tags: name }) => name);
  });
}
