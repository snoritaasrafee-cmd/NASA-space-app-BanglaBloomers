const API_KEY = 'G8Gas1lsJXauEbFuavZraSr6ivd0awV9g13zGrxU';
let allData = [];
let map, heatLayer;

document.addEventListener('DOMContentLoaded', () => {
  fetchPhenologyData();
  initMap();
  animateFlowers();
});

function animateFlowers() {
  const flowers = document.querySelectorAll('.flower');
  flowers.forEach(flower => {
    const startX = Math.random() * window.innerWidth;
    const startDelay = Math.random() * 10;
    flower.style.left = `${startX}px`;
    flower.style.animationDelay = `${startDelay}s`;
  });
}

function fetchPhenologyData() {
  fetch(`https://api.nasa.gov/globe/phenology?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      allData = data;
      populateFilters(data);
      renderData(data);
      renderChart(data);
      updateHeatmap(data);
    })
    .catch(err => {
      console.error('Error fetching data:', err);
      document.getElementById('phenology-data').innerHTML = 'Could not fetch NASA data.';
    });
}

function populateFilters(data) {
  const filterDiv = document.getElementById('filters');
  const speciesSet = new Set(data.map(d => d.species));
  speciesSet.forEach(species => {
    const btn = document.createElement('button');
    btn.textContent = species;
    btn.onclick = () => filterSpecies(species);
    filterDiv.appendChild(btn);
  });
}

function renderData(data) {
  const div = document.getElementById('phenology-data');
  div.innerHTML = '';
  data.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('phenology-item');
    card.innerHTML = `<h3>${item.species}</h3>
                      <p>Location: ${item.location}</p>
                      <p>Bloom Date: ${item.bloomDate}</p>`;
    div.appendChild(card);
  });
}

function renderChart(data) {
  const species = data.map(d => d.species);
  const counts = data.map(d => d.count || 1);

  const ctx = document.getElementById('phenologyChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: species,
      datasets: [{
        label: 'Observations Count',
        data: counts,
        backgroundColor: 'rgba(124,252,0,0.7)',
        borderColor: 'rgba(124,252,0,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function filterSpecies(name) {
  let filtered;
  if (name === 'All') filtered = allData;
  else filtered = allData.filter(d => d.species === name);

  renderData(filtered);
  renderChart(filtered);
  updateHeatmap(filtered);
}

function initMap() {
  map = L.map('mapid').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
  }).addTo(map);

  heatLayer = L.heatLayer([], { radius: 25, blur: 15, maxZoom: 10 }).addTo(map);

  // MODIS NDVI overlay (optional)
  L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI/default/2025-10-04/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', {
    attribution: 'NASA Earthdata',
    tileSize: 256,
    subdomains: 'abc',
    minZoom: 0,
    maxZoom: 9
  }).addTo(map);
}

function updateHeatmap(data) {
  const heatData = data
    .filter(d => d.lat && d.lng)
    .map(d => [d.lat, d.lng, 0.5]);
  heatLayer.setLatLngs(heatData);
}
