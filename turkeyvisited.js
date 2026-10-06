const HOVER_COLOR = "#AAE09C";
const SELECTED_COLOR = "#16B816";
const MAP_COLOR = "#fff2e3";
const STORAGE_KEY = "selectedCities";
const YEARS_KEY = "visitedCityYears";

// Keep the selected city names in one place so the map and counter stay in sync.
let selectedCities;
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  selectedCities = new Set(Array.isArray(stored) ? stored : []);
} catch {
  selectedCities = new Set();
}

let cityYears;
try {
  const stored = JSON.parse(localStorage.getItem(YEARS_KEY) || "{}");
  cityYears = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
} catch {
  cityYears = {};
}

const yearBox = document.getElementById("year_box");
const yearDisplay = document.getElementById("year_display");
const yearForm = document.getElementById("year_form");
const yearInput = document.getElementById("year_input");
yearInput.max = new Date().getFullYear();
let boxMode = "hidden";
let activeCity = null;

function positionYearBox(event) {
  const x = event.clientX || 16;
  const y = event.clientY || 16;
  yearBox.style.left = `${Math.max(8, Math.min(x + 12, innerWidth - yearBox.offsetWidth - 8))}px`;
  yearBox.style.top = `${Math.max(8, Math.min(y + 12, innerHeight - yearBox.offsetHeight - 8))}px`;
}

function hideYearBox() {
  yearBox.hidden = true;
  boxMode = "hidden";
  activeCity = null;
}

function showVisitYear(name, event) {
  if (boxMode === "edit") return;
  activeCity = name;
  boxMode = "hover";
  yearForm.hidden = true;
  yearDisplay.hidden = false;
  yearDisplay.textContent = `${name}: ${cityYears[name] || "Yıl eklenmedi"}`;
  yearBox.hidden = false;
  positionYearBox(event);
}

function editVisitYear(name, event) {
  activeCity = name;
  boxMode = "edit";
  yearDisplay.hidden = true;
  yearForm.hidden = false;
  document.getElementById("year_city").textContent = name;
  yearInput.value = cityYears[name] || "";
  yearBox.hidden = false;
  positionYearBox(event);
  yearInput.focus();
  yearInput.select();
}

yearForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (!yearForm.reportValidity()) return;
  cityYears[activeCity] = String(Number(yearInput.value));
  localStorage.setItem(YEARS_KEY, JSON.stringify(cityYears));
  hideYearBox();
});

document.getElementById("remove_city").addEventListener("click", function () {
  const name = activeCity;
  selectedCities.delete(name);
  delete cityYears[name];
  localStorage.setItem(YEARS_KEY, JSON.stringify(cityYears));
  saveSelection();
  d3.selectAll("#map_container path")
    .filter(d => d.properties.name === name)
    .attr("fill", MAP_COLOR);
  hideYearBox();
});

document.getElementById("close_year_box").addEventListener("click", hideYearBox);
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && boxMode === "edit") hideYearBox();
});

function updateCount() {
  document.getElementById("city_count").textContent = selectedCities.size;
}

function saveSelection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedCities]));
  updateCount();
}

updateCount();

d3.json("tr-cities.json").then(function (data) {
  const width = 1200;
  const height = 800;
  const projection = d3.geoEqualEarth().fitSize([width, height], data);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select("#map_container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  svg.append("g")
    .selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => selectedCities.has(d.properties.name) ? SELECTED_COLOR : MAP_COLOR)
    .attr("stroke", "#000")
    .on("mouseover", function (d) {
      d3.select(this).attr("fill", selectedCities.has(d.properties.name) ? SELECTED_COLOR : HOVER_COLOR);
      if (selectedCities.has(d.properties.name)) showVisitYear(d.properties.name, d3.event);
    })
    .on("mousemove", function (d) {
      if (boxMode === "hover" && activeCity === d.properties.name) positionYearBox(d3.event);
    })
    .on("mouseout", function (d) {
      d3.select(this).attr("fill", selectedCities.has(d.properties.name) ? SELECTED_COLOR : MAP_COLOR);
      if (boxMode === "hover" && activeCity === d.properties.name) hideYearBox();
    })
    .on("click", function (d) {
      const name = d.properties.name;
      if (!selectedCities.has(name)) {
        selectedCities.add(name);
        saveSelection();
      }
      d3.select(this).attr("fill", SELECTED_COLOR);
      editVisitYear(name, d3.event);
    });

  svg.append("g")
    .selectAll("text")
    .data(data.features)
    .enter()
    .append("text")
    .text(d => d.properties.name)
    .attr("x", d => path.centroid(d)[0])
    .attr("y", d => path.centroid(d)[1])
    .attr("text-anchor", "middle")
    .attr("font-family", "Comic Neue")
    .attr("font-size", "10pt")
    .attr("pointer-events", "none");
}).catch(function (error) {
  console.error("İl haritası yüklenemedi:", error);
  document.getElementById("map_container").textContent = "Harita yüklenemedi.";
});

function downloadMap() {
  const map = document.getElementById("map_container");
  let labels = [];
  // html2canvas rasterizes SVG text with a fallback font. Draw the labels on
  // the resulting canvas with the loaded Comic Neue font instead.
  document.fonts.load('10pt "Comic Neue"').then(() => html2canvas(map, {
    windowWidth: 1440,
    onclone: function (clonedDocument) {
      const clonedMap = clonedDocument.getElementById("map_container");
      const svg = clonedMap.querySelector("svg");
      const mapBounds = clonedMap.getBoundingClientRect();
      const svgBounds = svg.getBoundingClientRect();
      labels = [...svg.querySelectorAll("text")].map(function (label) {
        label.style.visibility = "hidden";
        return {
          name: label.textContent,
          x: svgBounds.left - mapBounds.left + Number(label.getAttribute("x")),
          y: svgBounds.top - mapBounds.top + Number(label.getAttribute("y"))
        };
      });
    }
  })).then(function (canvas) {
    const context = canvas.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.font = '10pt "Comic Neue"';
    context.fillStyle = "black";
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    labels.forEach(label => context.fillText(label.name, label.x, label.y));

    context.font = "20px sans-serif";
    context.textAlign = "start";
    context.textBaseline = "top";
    context.fillText(`${selectedCities.size}/81`, 10, 5);
    context.fillText("HMA-GR/Visited_Turkey", 10, canvas.height - 25);

    canvas.toBlob(function (blob) {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "turkeyvisited.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  });
}

function resetButton() {
  selectedCities.clear();
  cityYears = {};
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(YEARS_KEY);
  updateCount();
  d3.selectAll("#map_container path").attr("fill", MAP_COLOR);
  hideYearBox();
}
