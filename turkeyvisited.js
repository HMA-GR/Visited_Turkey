const HOVER_COLOR = "#DEF3D7";
const RECENT_COLOR = "#16B816";
const MULTIPLE_RECENT_COLOR = "#FFD700";
const MAP_COLOR = "#fff2e3";
const STORAGE_KEY = "selectedCities";
const YEARS_KEY = "visitedCityYears";
const BACKUP_FORMAT = "visited-turkey-backup";
const BACKUP_VERSION = 1;

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
    let needsMigration = false;
    for (const [name, value] of Object.entries(stored)) {
      // Older versions allowed the same year more than once or stored one year as a string.
      const years = Array.isArray(value) ? value : [value];
      cityYears[name] = [...new Set(years.map(Number).filter(Number.isInteger))]
        .sort((a, b) => b - a);
      if (JSON.stringify(value) !== JSON.stringify(cityYears[name])) needsMigration = true;
    }
    if (needsMigration) localStorage.setItem(YEARS_KEY, JSON.stringify(cityYears));
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
const backupFile = document.getElementById("backup_file");
const backupStatus = document.getElementById("backup_status");
let availableCities = new Set();
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
      fill: recentVisits > 1 ? MULTIPLE_RECENT_COLOR : RECENT_COLOR,
      label: "black"
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
  input.addEventListener("input", validateUniqueYears);
  yearInputs.appendChild(input);
  return input;
}

function validateUniqueYears() {
  const seen = new Set();
  for (const input of yearInputs.children) {
    input.setCustomValidity("");
    if (input.value === "") continue;
    const year = Number(input.value);
    if (seen.has(year)) input.setCustomValidity("Bu yıl zaten eklenmiş.");
    seen.add(year);
  }
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
  validateUniqueYears();
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

function validateBackup(backup) {
  if (!backup || typeof backup !== "object" || Array.isArray(backup) ||
      backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) {
    throw new Error("Bu dosya desteklenen bir Visited Turkey yedeği değil.");
  }
  if (!Array.isArray(backup.selectedCities) || !backup.visitedCityYears ||
      typeof backup.visitedCityYears !== "object" || Array.isArray(backup.visitedCityYears)) {
    throw new Error("Yedekte şehir veya yıl verisi eksik.");
  }

  const cities = new Set();
  for (const name of backup.selectedCities) {
    if (typeof name !== "string" || !availableCities.has(name) || cities.has(name)) {
      throw new Error("Yedekte geçersiz veya tekrarlanan bir şehir var.");
    }
    cities.add(name);
  }

  const yearsByCity = {};
  const currentYear = new Date().getFullYear();
  for (const [name, years] of Object.entries(backup.visitedCityYears)) {
    if (!cities.has(name) || !Array.isArray(years)) {
      throw new Error("Yedekte seçilmemiş bir şehre ait yıl verisi var.");
    }
    const uniqueYears = new Set();
    for (const year of years) {
      if (!Number.isInteger(year) || year < 1900 || year > currentYear || uniqueYears.has(year)) {
        throw new Error("Yedekte geçersiz veya tekrarlanan bir ziyaret yılı var.");
      }
      uniqueYears.add(year);
    }
    yearsByCity[name] = [...uniqueYears].sort((a, b) => b - a);
  }
  return { cities: [...cities], yearsByCity };
}

document.getElementById("export_backup").addEventListener("click", function () {
  try {
    const yearsByCity = Object.fromEntries([...selectedCities]
      .filter(name => cityYears[name]?.length)
      .map(name => [name, cityYears[name]]));
    const backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      selectedCities: [...selectedCities],
      visitedCityYears: yearsByCity
    };
    validateBackup(backup);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const today = new Date();
    const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")].join("-");
    const link = document.createElement("a");
    link.href = url;
    link.download = `visited-turkey-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    backupStatus.textContent = "JSON yedeği indirildi.";
  } catch (error) {
    backupStatus.textContent = `Yedek oluşturulamadı: ${error.message}`;
  }
});

document.getElementById("import_backup").addEventListener("click", () => backupFile.click());
backupFile.addEventListener("change", async function () {
  const file = backupFile.files[0];
  if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error("Yedek dosyası çok büyük.");
    const backup = validateBackup(JSON.parse(await file.text()));
    if (!confirm("Bu yedek mevcut işaretlemelerin ve ziyaret yıllarının yerine geçecek. Devam edilsin mi?")) {
      backupStatus.textContent = "Yükleme iptal edildi.";
      return;
    }

    const previousCities = localStorage.getItem(STORAGE_KEY);
    const previousYears = localStorage.getItem(YEARS_KEY);
    try {
      localStorage.setItem(YEARS_KEY, JSON.stringify(backup.yearsByCity));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.cities));
    } catch (error) {
      if (previousYears === null) localStorage.removeItem(YEARS_KEY);
      else localStorage.setItem(YEARS_KEY, previousYears);
      if (previousCities === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, previousCities);
      throw error;
    }

    cityYears = backup.yearsByCity;
    selectedCities = new Set(backup.cities);
    updateCount();
    refreshMapColors();
    hideYearBox();
    backupStatus.textContent = `${selectedCities.size} şehir yedekten yüklendi.`;
  } catch (error) {
    backupStatus.textContent = `Yedek yüklenemedi: ${error.message}`;
  } finally {
    backupFile.value = "";
  }
});

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

  availableCities = new Set(data.features.map(feature => feature.properties.name));
  document.getElementById("export_backup").disabled = false;
  document.getElementById("import_backup").disabled = false;
  scheduleNewYearRefresh();
}).catch(function (error) {
  console.error("İl haritası yüklenemedi:", error);
  document.getElementById("map_container").textContent = "Harita yüklenemedi.";
});

async function downloadMap() {
  const svg = document.querySelector("#map_container svg");
  if (!svg) return;
  await document.fonts.load('10pt "Comic Neue"');

  const paths = [...svg.querySelectorAll("path")];
  const bounds = paths.map(path => path.getBBox());
  const left = Math.min(...bounds.map(box => box.x));
  const top = Math.min(...bounds.map(box => box.y));
  const right = Math.max(...bounds.map(box => box.x + box.width));
  const bottom = Math.max(...bounds.map(box => box.y + box.height));
  const padding = 16;
  const footer = 30;
  const offsetX = padding - left;
  const offsetY = padding - top;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(right - left + padding * 2);
  canvas.height = Math.ceil(bottom - top + padding * 2 + footer);
  const context = canvas.getContext("2d");
  context.fillStyle = "#e3e2df";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const svgCopy = svg.cloneNode(true);
  svgCopy.querySelectorAll("text").forEach(label => label.remove());
  svgCopy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgUrl = URL.createObjectURL(new Blob(
    [new XMLSerializer().serializeToString(svgCopy)], { type: "image/svg+xml" }
  ));
  const image = new Image();
  image.onload = function () {
    URL.revokeObjectURL(svgUrl);
    context.drawImage(image, offsetX, offsetY,
      Number(svg.getAttribute("width")), Number(svg.getAttribute("height")));
    context.font = '10pt "Comic Neue"';
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    svg.querySelectorAll("text").forEach(function (label) {
      context.fillStyle = label.getAttribute("fill") || "black";
      context.fillText(label.textContent,
        Number(label.getAttribute("x")) + offsetX,
        Number(label.getAttribute("y")) + offsetY);
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
  };
  image.onerror = () => URL.revokeObjectURL(svgUrl);
  image.src = svgUrl;
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
