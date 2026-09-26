const apiKey = "";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");

async function checkWeather(city) {
  const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
  const data = await response.json();

  // Handle invalid city or API key
  if (response.status !== 200) {
    alert("Error: " + (data.message || "Unable to fetch weather"));
    return;
  }

  // Basic weather info
  document.querySelector(".location").innerHTML = data.name + " City";
  document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "&deg;C";
  document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
  document.querySelector(".wind").innerHTML = data.wind.speed + "km/h";
  document.querySelector(".pressure").innerHTML = data.main.pressure + " hPa";

  // Define mapping for weather conditions
  const weatherMap = {
    Clouds: { icon: "images/cloudy.png", label: "Cloudy" },
    Clear: { icon: "images/sunny.png", label: "Clear skies" },
    Rain: { icon: "images/rainyday.png", label: "Rainy" },
    Drizzle: { icon: "images/drizzle.png", label: "Drizzle" },
    Thunderstorm: { icon: "images/thunderstorm.png", label: "Thunderstorm" },
    Snow: { icon: "images/snowy.png", label: "Snow" },
    Mist: { icon: "images/foggy.png", label: "Low visibility" },
    Fog: { icon: "images/foggy.png", label: "Low visibility" },
    Haze: { icon: "images/foggy.png", label: "Low visibility" },
    Smoke: { icon: "images/foggy.png", label: "Low visibility" }
  };

  // Pick correct mapping or fallback
  const condition = data.weather[0].main;
  const desc = data.weather[0].description;
  const selected = weatherMap[condition] || { icon: "images/sunny.png", label: condition };

  weatherIcon.src = selected.icon;
  document.querySelector(".cond").innerHTML = `${selected.label} • ${desc}`;

  // Show card
  document.querySelector(".card").style.display = "block";
}

searchBtn.addEventListener("click", () => {
  checkWeather(searchBox.value);
});

// Update time function
function updateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.querySelector(".date.small").innerHTML = "Updated " + time;
}

updateTime();
setInterval(updateTime, 60000);
