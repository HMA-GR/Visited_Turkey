const HOVER_COLOR = "#DEF3D7";
const RECENT_COLOR = "#16B816";
const MULTIPLE_RECENT_LABEL_COLOR = "#FFD700";
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
  cityYears = {};
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    for (const [name, value] of Object.entries(stored)) {
      // Older versions stored one year as a string. Keep those visits.
      const years = Array.isArray(value) ? value : [value];
      cityYears[name] = years.map(Number).filter(Number.isInteger).sort((a, b) => b - a);
    }
  }
} catch {
  cityYears = {};
}

const yearBox = document.getElementById("year_box");
const yearDisplay = document.getElementById("year_display");
const yearForm = document.getElementById("year_form");
const yearInputs = document.getElementById("year_inputs");
const infoButton = document.getElementById("info_button");
const infoPanel = document.getElementById("info_panel");
let boxMode = "hidden";
let activeCity = null;
let boxAnchor = null;

function cityStyle(name) {
  if (!selectedCities.has(name)) return { fill: MAP_COLOR, label: "black" };

  const years = cityYears[name] || [];
  if (!years.length) return { fill: RECENT_COLOR, label: "black" };

  const currentYear = new Date().getFullYear();
  const yearsSinceVisit = currentYear - years[0];
  if (yearsSinceVisit <= 3) {
    const recentVisits = years.filter(year => currentYear - year >= 0 && currentYear - year <= 3).length;
    return {
      fill: RECENT_COLOR,
      label: recentVisits > 1 ? MULTIPLE_RECENT_LABEL_COLOR : "black"
    };
  }
  if (yearsSinceVisit <= 6) return { fill: "#72CD61", label: "black" };
  if (yearsSinceVisit <= 10) return { fill: "#98DA89", label: "black" };
  return { fill: "#BCE7B0", label: "black" };
}

function refreshMapColors() {
  d3.selectAll("#map_container path")
    .attr("fill", d => cityStyle(d.properties.name).fill);
  d3.selectAll("#map_container text")
    .attr("fill", d => cityStyle(d.properties.name).label);
}

function scheduleNewYearRefresh() {
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  const oneDay = 24 * 60 * 60 * 1000;
  setTimeout(function () {
    refreshMapColors();
    scheduleNewYearRefresh();
  }, Math.max(1000, Math.min(nextYear - now + 1000, oneDay)));
}

document.addEventListener("visibilitychange", function () {
  if (!document.hidden) refreshMapColors();
});

infoButton.addEventListener("click", function () {
  infoPanel.hidden = !infoPanel.hidden;
  infoButton.setAttribute("aria-expanded", String(!infoPanel.hidden));
});
document.getElementById("close_info").addEventListener("click", function () {
  infoPanel.hidden = true;
  infoButton.setAttribute("aria-expanded", "false");
  infoButton.focus();
});

function addYearInput(value = "") {
  const input = document.createElement("input");
  input.className = "year-input";
  input.type = "number";
  input.min = "1900";
  input.max = String(new Date().getFullYear());
  input.step = "1";
  input.required = true;
  input.placeholder = "Örn. 2023";
  input.setAttribute("aria-label", `Ziyaret yılı ${yearInputs.children.length + 1}`);
  input.value = value;
  yearInputs.appendChild(input);
  return input;
}

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
  const years = cityYears[name] || [];
  yearDisplay.textContent = `${name}: ${years.length
    ? years.slice(0, 3).join(", ") + (years.length > 3 ? " ..." : "")
    : "Yıl eklenmedi"}`;
  yearBox.hidden = false;
  positionYearBox(event);
}

function editVisitYear(name, event) {
  activeCity = name;
  boxMode = "edit";
  yearDisplay.hidden = true;
  yearForm.hidden = false;
  document.getElementById("year_city").textContent = name;
  yearInputs.replaceChildren();
  const years = cityYears[name] || [];
  (years.length ? years : [""]).forEach(addYearInput);
  yearBox.hidden = false;
  boxAnchor = { clientX: event.clientX, clientY: event.clientY };
  positionYearBox(boxAnchor);
  yearInputs.firstElementChild.focus();
  yearInputs.firstElementChild.select();
}

yearForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (!yearForm.reportValidity()) return;
  cityYears[activeCity] = [...yearInputs.children]
    .map(input => Number(input.value))
    .sort((a, b) => b - a);
  localStorage.setItem(YEARS_KEY, JSON.stringify(cityYears));
  refreshMapColors();
  hideYearBox();
});

document.getElementById("add_year").addEventListener("click", function () {
  const input = addYearInput();
  positionYearBox(boxAnchor);
  input.focus();
});

document.getElementById("remove_city").addEventListener("click", function () {
  const name = activeCity;
  selectedCities.delete(name);
  delete cityYears[name];
  localStorage.setItem(YEARS_KEY, JSON.stringify(cityYears));
  saveSelection();
  refreshMapColors();
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
  const width = 1320;
  const height = 880;
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
    .attr("fill", d => cityStyle(d.properties.name).fill)
    .attr("stroke", "#000")
    .on("mouseover", function (d) {
      d3.select(this).attr("fill", selectedCities.has(d.properties.name) ? cityStyle(d.properties.name).fill : HOVER_COLOR);
      if (selectedCities.has(d.properties.name)) showVisitYear(d.properties.name, d3.event);
    })
    .on("mousemove", function (d) {
      if (boxMode === "hover" && activeCity === d.properties.name) positionYearBox(d3.event);
    })
    .on("mouseout", function (d) {
      d3.select(this).attr("fill", cityStyle(d.properties.name).fill);
      if (boxMode === "hover" && activeCity === d.properties.name) hideYearBox();
    })
    .on("click", function (d) {
      const name = d.properties.name;
      if (!selectedCities.has(name)) {
        selectedCities.add(name);
        saveSelection();
      }
      refreshMapColors();
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
    .attr("fill", d => cityStyle(d.properties.name).label)
    .attr("pointer-events", "none");

  scheduleNewYearRefresh();
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
          color: label.getAttribute("fill") || "black",
          x: svgBounds.left - mapBounds.left + Number(label.getAttribute("x")),
          y: svgBounds.top - mapBounds.top + Number(label.getAttribute("y"))
        };
      });
    }
  })).then(function (canvas) {
    const context = canvas.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.font = '10pt "Comic Neue"';
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    labels.forEach(function (label) {
      context.fillStyle = label.color;
      context.fillText(label.name, label.x, label.y);
    });

    context.font = "20px sans-serif";
    context.fillStyle = "black";
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
  refreshMapColors();
  hideYearBox();
}
