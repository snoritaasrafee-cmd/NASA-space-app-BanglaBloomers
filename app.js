// Floating flowers/stars
for(let i=0;i<15;i++){let f=document.createElement("div");f.className="floating-flower";f.style.left=Math.random()*100+"vw";f.style.width=15+Math.random()*15+"px";f.style.height=15+Math.random()*15+"px";f.style.animationDuration=8+Math.random()*8+"s";document.body.appendChild(f);}
for(let i=0;i<30;i++){let s=document.createElement("div");s.className="star";s.style.left=Math.random()*100+"vw";s.style.animationDuration=15+Math.random()*10+"s";document.body.appendChild(s);}

// Sidebar facts
const facts=[
  "NASA satellites help track vegetation growth across the globe in near real-time.",
  "Phenology is the study of periodic plant and animal life cycle events.",
  "NDVI helps determine plant health using satellite data.",
  "Cherry blossoms in Japan have been tracked by NASA to study climate impacts.",
  "Sunflowers track the sun, a phenomenon called heliotropism.",
  "NASA GLOBE Observer allows citizens worldwide to submit bloom observations.",
  "Tracking blooms helps predict pollinator activity and ecosystem health.",
  "MODIS satellites provide high-resolution NDVI data every 16 days.",
  "Phenology data can be used to study climate change effects on plant life.",
  "BloomWatch combines citizen science and satellite data for actionable insights."
];
const factsText=document.getElementById("factsText");
const newFactBtn=document.getElementById("newFact");
function showRandomFact(){factsText.textContent=facts[Math.floor(Math.random()*facts.length)];}
showRandomFact();
newFactBtn.addEventListener("click",showRandomFact);

// DOM elements
const speciesFilter=document.getElementById("speciesFilter");
const timeline=document.getElementById("timeline");
const timelineDate=document.getElementById("timeline-date");
const ndviFilter=document.getElementById("ndviFilter");
const totalObs=document.getElementById("totalObs");
const speciesCount=document.getElementById("speciesCount");
const nextBloom=document.getElementById("nextBloom");
const topSpeciesList=document.getElementById("topSpeciesList");
const exportCSV=document.getElementById("exportCSV");
const playTimelineBtn=document.getElementById("playTimeline");
const playNDVIBtn=document.getElementById("playNDVI");
const predictionText=document.getElementById("prediction-text");

let allData=[],animIndex=0,isPlaying=false,animationInterval,ndviInterval;

// Map setup
const map=L.map('map').setView([20,0],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:"© OpenStreetMap"}).addTo(map);
let ndvi=L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.png",{attribution:"NASA MODIS NDVI"}).addTo(map);
const heatLayer=L.heatLayer([], {radius:25, blur:15, maxZoom:10}).addTo(map);

// Fetch data
async function fetchData(){
  document.getElementById("loadingOverlay").style.display="flex";
  try{
    const res=await fetch("https://api.globe.gov/bloom?apikey=G8Gas1lsJXauEbFuavZraSr6ivd0awV9g13zGrxU");
    allData=await res.json();
    if(!allData.length){throw "Empty Data";}
  }catch(e){
    allData=[{species:"Cherry Blossom",date:"2025-03-28",lat:35.68,lng:139.69,ndvi:0.65},
             {species:"Sunflower",date:"2025-06-10",lat:36.77,lng:-119.41,ndvi:0.8},
             {species:"Lavender",date:"2025-07-15",lat:43.77,lng:11.25,ndvi:0.55}];
  }finally{
    populateSpecies();
    renderVisuals();
    document.getElementById("loadingOverlay").style.display="none";
  }
}

function populateSpecies(){
  const speciesSet=new Set(allData.map(d=>d.species));
  speciesSet.forEach(s=>{let opt=document.createElement("option");opt.value=s;opt.textContent=s;speciesFilter.appendChild(opt);});
}

// Render
function renderVisuals(){
  let filtered=allData;
  if(speciesFilter.value!=="All") filtered=filtered.filter(d=>d.species===speciesFilter.value);
  if(ndviFilter.checked) filtered=filtered.filter(d=>d.ndvi>0.5);
  renderData(filtered); renderCharts(); updateHeroStats(); updateTopSpecies(); updateHotspot();
}

function renderData(data){ heatLayer.setLatLngs(data.map(d=>[d.lat,d.lng,d.ndvi])); }

function renderCharts(){
  const ctx=document.getElementById("barChart").getContext("2d");
  const counts={};
  allData.forEach(d=>{counts[d.species]=(counts[d.species]||0)+1;});
  new Chart(ctx,{type:"bar",data:{labels:Object.keys(counts),datasets:[{label:"Observations",data:Object.values(counts),backgroundColor:"#2ecc71"}]},options:{responsive:true,plugins:{legend:{display:false}}}});

  const timelineCtx=document.getElementById("timelineChart").getContext("2d");
  const dates=[...new Set(allData.map(d=>d.date))].sort((a,b)=>new Date(a)-new Date(b));
  const timelineCounts=dates.map(dt=>allData.filter(d=>d.date===dt).length);
  new Chart(timelineCtx,{type:"line",data:{labels:dates,datasets:[{label:"Blooms Over Time",data:timelineCounts,borderColor:"#ff4757",backgroundColor:"rgba(255,71,87,0.3)",fill:true}]},options:{responsive:true}});
}

function updateHeroStats(){
  totalObs.textContent=allData.length;
  speciesCount.textContent=new Set(allData.map(d=>d.species)).size;
  nextBloom.textContent=predictNextBloom()[0]||"N/A";
}

function updateTopSpecies(){
  const counts={};
  allData.forEach(d=>{counts[d.species]=(counts[d.species]||0)+1;});
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  topSpeciesList.innerHTML="";
  sorted.forEach(s=>{let span=document.createElement("span");span.textContent=s[0]+" ";span.className="pred-item";topSpeciesList.appendChild(span);});
}

function predictNextBloom(){ return allData.map(d=>{let next=new Date(d.date); next.setDate(next.getDate()+7); return `${d.species} around ${next.toISOString().split("T")[0]}`;}); }

function updateHotspot(){
  if(!allData.length){document.getElementById("hotspot").textContent="N/A"; return;}
  const counts={};
  allData.forEach(d=>{const key=d.lat.toFixed(1)+","+d.lng.toFixed(1); counts[key]=(counts[key]||0)+1;});
  const hotspot=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  document.getElementById("hotspot").textContent=hotspot;
}

// CSV Export
exportCSV.addEventListener("click",()=>{
  let filtered=allData;
  if(speciesFilter.value!=="All") filtered=filtered.filter(d=>d.species===speciesFilter.value);
  if(ndviFilter.checked) filtered=filtered.filter(d=>d.ndvi>0.5);
  const csv="Species,Date,Lat,Lng,NDVI\n"+filtered.map(d=>`${d.species},${d.date},${d.lat},${d.lng},${d.ndvi.toFixed(2)}`).join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="bloom_data.csv"; a.click(); URL.revokeObjectURL(url);
});

// Timeline animation
playTimelineBtn.addEventListener("click",()=>{
  if(isPlaying){clearInterval(animationInterval);playTimelineBtn.textContent="▶️ Play Timeline";isPlaying=false;return;}
  const dates=[...new Set(allData.map(d=>d.date))].sort((a,b)=>new Date(a)-new Date(b));
  animIndex=0; playTimelineBtn.textContent="⏸ Pause"; isPlaying=true;
  animationInterval=setInterval(()=>{
    if(animIndex>=dates.length){animIndex=0;}
    const currentDate=dates[animIndex];
    timelineDate.textContent=`Date: ${currentDate}`;
    renderData(allData.filter(d=>new Date(d.date)<=new Date(currentDate)));
    renderCharts(); updateTopSpecies(); updateHotspot(); animIndex++;
  },800);
});

// NDVI animation
playNDVIBtn.addEventListener("click",()=>{
  if(ndviInterval){clearInterval(ndviInterval);playNDVIBtn.textContent="▶️ Animate NDVI";ndviInterval=null; return;}
  let timeIndex=0;
  const times=["2025-01-01","2025-03-01","2025-05-01","2025-07-01","2025-09-01","2025-11-01"];
  playNDVIBtn.textContent="⏸ Pause NDVI";
  ndviInterval=setInterval(()=>{
    ndvi.setUrl(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI/default/${times[timeIndex]}/{TileMatrixSet}/{z}/{y}/{x}.png`);
    timeIndex=(timeIndex+1)%times.length;
  },1200);
});

// Filters
speciesFilter.addEventListener("change",renderVisuals);
ndviFilter.addEventListener("change",renderVisuals);
timeline.addEventListener("input",renderVisuals);

fetchData();
