const HOVER_COLOR = "#EFAE88";
const MAP_COLOR = "#fff2e3";
const STORAGE_KEY = "selectedCities";

// Keep the selected city names in one place so the map and counter stay in sync.
let selectedCities;
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  selectedCities = new Set(Array.isArray(stored) ? stored : []);
} catch {
  selectedCities = new Set();
}

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
    .attr("fill", d => selectedCities.has(d.properties.name) ? HOVER_COLOR : MAP_COLOR)
    .attr("stroke", "#000")
    .on("mouseover", function () {
      d3.select(this).attr("fill", HOVER_COLOR);
    })
    .on("mouseout", function (d) {
      d3.select(this).attr("fill", selectedCities.has(d.properties.name) ? HOVER_COLOR : MAP_COLOR);
    })
    .on("click", function (d) {
      const name = d.properties.name;
      if (selectedCities.has(name)) {
        selectedCities.delete(name);
      } else {
        selectedCities.add(name);
      }
      d3.select(this).attr("fill", selectedCities.has(name) ? HOVER_COLOR : MAP_COLOR);
      saveSelection();
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
    .attr("font-size", "10pt")
    .attr("pointer-events", "none");
}).catch(function (error) {
  console.error("İl haritası yüklenemedi:", error);
  document.getElementById("map_container").textContent = "Harita yüklenemedi.";
});

function downloadMap() {
  const map = document.getElementById("map_container");
  // Render at the original desktop width even when the page is viewed on a phone.
  html2canvas(map, { windowWidth: 1440 }).then(function (canvas) {
    const context = canvas.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.font = "20px sans-serif";
    context.fillStyle = "black";
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
  localStorage.removeItem(STORAGE_KEY);
  updateCount();
  d3.selectAll("#map_container path").attr("fill", MAP_COLOR);
}
