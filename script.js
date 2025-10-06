document.getElementById('searchBtn').addEventListener('click', getWeather);
document.getElementById('cityInput').addEventListener('keypress', e => { if(e.key==='Enter') getWeather(); });

const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  darkModeToggle.textContent = document.body.classList.contains('dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

const apiKey = '7da9dd48c468ce9fe0abf3d8c19bc8cf';
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
const cityData = {}; let chart = null;
displayRecentCities();

async function getWeather(cityName=null){
  const city = cityName || document.getElementById('cityInput').value.trim();
  if(!city){ alert('Please enter a city name'); return; }

  const url=`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  try{
    const res=await fetch(url);
    const data=await res.json();
    if(data.cod===200){ displayWeather(data); saveRecentCity(data.name);}
    else if(data.cod==="404") document.getElementById('weatherInfo').innerHTML=`<p>⚠️ City not found!</p>`;
    else if(data.cod===401) document.getElementById('weatherInfo').innerHTML=`<p>🚫 Invalid API key.</p>`;
    else document.getElementById('weatherInfo').innerHTML=`<p>❌ Unexpected error.</p>`;
  }catch(err){ console.error(err); document.getElementById('weatherInfo').innerHTML=`<p>💥 Network error.</p>`;}
}

function displayWeather(data){
  document.getElementById('weatherInfo').innerHTML=`
    <h2>${data.name}, ${data.sys.country}</h2>
    <p>🌡 Temperature: ${data.main.temp}°C</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>🌬 Wind Speed: ${data.wind.speed} m/s</p>
    <p>☁ Condition: ${data.weather[0].description} 
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
      alt="icon" style="vertical-align:middle;width:40px;" class="${data.weather[0].main==='Clear'?'sun':''}">
    </p>
  `;
  cityData[data.name]={temp:data.main.temp,humidity:data.main.humidity};
  updateChart();
  displayForecast(data.name);
  setDynamicBackground(data.weather[0].main);
}

async function displayForecast(city){
  const url=`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
  try{
    const res=await fetch(url); const data=await res.json();
    if(data.cod==="200"){
      const container=document.getElementById('forecast');
      container.innerHTML=`<h3>5-Day Forecast</h3><div style="display:flex; justify-content: space-between;">`;
      for(let i=0;i<data.list.length;i+=8){
        const item=data.list[i];
        const date=new Date(item.dt_txt).toLocaleDateString('en-US',{weekday:'short'});
        const icon=`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
        container.innerHTML+=`
          <div style="text-align:center; flex:1;" title="Min:${item.main.temp_min}°C, Max:${item.main.temp_max}°C, Wind:${item.wind.speed} m/s">
            <p>${date}</p>
            <img src="${icon}" alt="${item.weather[0].description}" />
            <p>${item.main.temp.toFixed(0)}°C</p>
            <p style="font-size:12px;">${item.weather[0].main}</p>
          </div>
        `;
      }
      container.innerHTML+=`</div>`;
    }
  }catch(err){console.error(err);}
}

function saveRecentCity(city){
  if(!recentCities.includes(city)){
    recentCities.unshift(city);
    if(recentCities.length>5) recentCities.pop();
    localStorage.setItem('recentCities',JSON.stringify(recentCities));
    displayRecentCities();
  }
}

function displayRecentCities(){
  let container=document.getElementById('recentCities');
  if(!container){
    container=document.createElement('div');
    container.id='recentCities';
    document.querySelector('.app').appendChild(container);
  }
  container.innerHTML='<h3>Recent Searches:</h3>';
  recentCities.forEach(city=>{
    const btn=document.createElement('button');
    btn.textContent=city; btn.addEventListener('click',()=>getWeather(city));
    container.appendChild(btn);
  });
}

function updateChart(){
  const ctx=document.getElementById('weatherChart').getContext('2d');
  const labels=recentCities;
  const tempData=recentCities.map(city=>cityData[city]?.temp||0);
  const humidityData=recentCities.map(city=>cityData[city]?.humidity||0);
  if(chart) chart.destroy();
  chart=new Chart(ctx,{
    type:'bar',
    data:{labels, datasets:[
      {label:'Temperature (°C)', data:tempData, backgroundColor:'rgba(255,99,132,0.6)'},
      {label:'Humidity (%)', data:humidityData, backgroundColor:'rgba(54,162,235,0.6)'}
    ]},
    options:{
      responsive:true,
      animation:{duration:1000,easing:'easeOutBounce'},
      plugins:{legend:{position:'top'}, title:{display:true,text:'Temperature & Humidity Trends'}}
    }
  });
}

// Dynamic background based on weather
function setDynamicBackground(weather){
  document.body.className='';
  if(weather==='Clear') document.body.classList.add('sunny');
  else if(weather==='Rain') document.body.classList.add('rainy');
  else if(weather==='Clouds') document.body.classList.add('clouds');
}
