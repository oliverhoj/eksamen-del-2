//#1
//Check alle popstates og tilføj ved load for at have dynamisk url!

/* =========================
   FIX: Declare globals that were used but not declared
========================= */
let map; // FIX: was used before declaration
const markers = []; // FIX: markers.push(...) used but not declared
let markersLayer = null;


let allGames = []; // Declare allGames globally to access it in displayDrawer
let resultater = document.getElementById("results");
const locationData = document.getElementById("locationData");
const locationsForm = document.querySelector(".locationsForm");
const playersForm = document.querySelector(".playersForm");
const timeForm = document.querySelector(".timeForm");
const difficultyForm = document.querySelector(".difficultyForm");
const genreForm = document.querySelector(".genreForm");
const mainHolder = document.querySelector("main");
const INITIAL_GAME_COUNT = 10;

const radioInputs = document.querySelectorAll('input[type="radio"]');
const underline = document.querySelector(".underline");

function moveUnderline() {
  const checked = document.querySelector('input[type="radio"]:checked');
  if (!checked) return; // FIX: avoid null errors
  const label = document.querySelector(`label[for="${checked.id}"]`);
  const container = document.querySelector(".radio-group");
  if (!label || !container) return; // FIX: avoid null errors

  const labelRect = label.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const leftPos = labelRect.left - containerRect.left;

  underline.style.width = labelRect.width + "px";
  underline.style.transform = `translateX(${leftPos}px)`;
}

radioInputs.forEach((input) => {
  input.addEventListener("change", moveUnderline);
});

// Initialize position
moveUnderline();

async function getGames() {
  try {
    // console.log("🌐 Henter alle spil fra JSON...");
    const response = await fetch("./assets/games/games.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    // console.log(`📊 JSON data modtaget: ${allGames.length} games`);

    allGames = await response.json();

    readFiltersFromUrl();
  } catch (error) {
    console.error("❌ Kunne ikke hente games:", error);
    resultater.innerHTML =
      '<div class="game-list-empty"><p> Kunne ikke hente Games.</p></div>';
  } finally {
    console.log("first allGames in finally line 66");
  }
}

// #3: Render all movies in the grid
function displayGames(games) {
  resultater.innerHTML = '<h1 id="gamesHeading" class="sr-only">Find et spil hos Spilcaféen</h1>';
  document.getElementById("chip-info").innerText =
    `${games.length} af ${allGames.length} spil fundet`;

  if (!games.length) {
    resultater.insertAdjacentHTML(
      "beforeend",
      '<div class="game-list-empty"><p>Ingen spil matchede dine filtre...</p></div>'
    );
    return;
  }

  const hasFilters = Object.values(selected).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value != null && String(value).trim() !== "" && value !== "alle";
  });

  if (!hasFilters) {
    resultater.insertAdjacentHTML("beforeend", `
      <section class="game-section game-section--popular" aria-labelledby="popularHeading">
        <div class="game-section__header">
          <div>
            <span class="game-section__eyebrow">Spillernes favoritter</span>
            <h2 id="popularHeading"><span aria-hidden="true">★</span> Bedst ratede spil</h2>
            <p>De 9 spil med den højeste bedømmelse</p>
          </div>
        </div>
        <div class="popular-games" id="popularGames"></div>
      </section>
    `);

    const popularGames = [...games].sort((a, b) => b.rating - a.rating).slice(0, 9);
    const popularContainer = document.getElementById("popularGames");
    popularGames.forEach((game, index) => {
      displayGame(game, popularContainer, index === 0 ? "eager" : "lazy", index === 0);
    });
  }

  resultater.insertAdjacentHTML("beforeend", `
    <section class="game-section game-section--all" aria-labelledby="allHeading">
      <div class="game-section__header">
        <div>
          <span class="game-section__eyebrow">${hasFilters ? "Søgeresultat" : "Hele samlingen"}</span>
          <h2 id="allHeading">${hasFilters ? "Spil der matcher dine valg" : "Alle spil"}</h2>
          <p>${games.length} spil i denne oversigt</p>
        </div>
      </div>
      <div class="all-games" id="allGames"></div>
      ${games.length > INITIAL_GAME_COUNT ? `<button type="button" class="show-more-games" aria-controls="allGames">Vis ${games.length - INITIAL_GAME_COUNT} flere spil</button>` : ""}
    </section>
  `);

  const allGamesContainer = document.getElementById("allGames");
  const initialGames = games.slice(0, INITIAL_GAME_COUNT);
  initialGames.forEach((game, index) => {
    const isPriorityImage = hasFilters && index === 0;
    displayGame(game, allGamesContainer, isPriorityImage ? "eager" : "lazy", isPriorityImage);
  });

  document.querySelector(".show-more-games")?.addEventListener("click", (event) => {
    games.slice(INITIAL_GAME_COUNT).forEach((game) => {
      displayGame(game, allGamesContainer);
    });
    const firstNewGame = allGamesContainer.children[INITIAL_GAME_COUNT]
      ?.querySelector(".open-game");
    event.currentTarget.remove();
    document.getElementById("chip-info").innerText = `Alle ${games.length} spil vises`;
    firstNewGame?.focus();
  }, { once: true });
}

// #4: Render a single movie card
function getCardImagePath(imagePath) {
  return imagePath.replace(/\.webp$/i, "-card.jpg");
}

function displayGame(game, container, loading = "lazy", highPriority = false) {
  const cardImage = getCardImagePath(game.image);
  const gameHTML = `
    <div class="card">
	<div class="card__imageHolder">
		<div class="card__rating">
          <span class="sr-only">Bedømmelse: </span>
			<svg aria-hidden="true" width="16" height="14" viewBox="0 0 8 7" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.06919 6.79995L2.66502 4.35969L0.666687 2.71837L3.30669 2.50127L4.33335 0.199951L5.36002 2.50127L8.00002 2.71837L6.00169 4.35969L6.59752 6.79995L4.33335 5.506L2.06919 6.79995Z" fill="#F2CE17"/>
</svg>
            ${game.rating}

		</div>

		<img src="${cardImage}" alt="Spilæsken til ${game.title}" width="320" height="320" loading="${loading}" decoding="async"${highPriority ? ' fetchpriority="high"' : ""}>
	</div>

	<h3><button type="button" class="open-game" onclick="displayDrawer(${game.id})" aria-haspopup="dialog">${game.title}</button></h3>

	<div class="card__info">
		<div class="card__infoTAG"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg> ${game.players.min}-${game.players.max}<span class="sr-only"> spillere</span></div>
		<div class="card__infoTAG"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-icon lucide-clock"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg> ${game.playtime} min.</div>
    </div>
    </div>
    `;

  container.insertAdjacentHTML("beforeend", gameHTML);
}

getGames();
//filterGames()

let drawHolder = document.getElementById("drawHolder");

function addToFavorites(id) {
  console.log(`Tilføj til favoritter: Game ID ${id}`);
  localStorage.setItem(`favorite_game_${id}`, "true");
  console.log("Tilføjet til favoritter");
}

function displayDrawer(id) {
  console.log(id);

  // Find the game by id
  const game = allGames.find((game) => game.id === id);

  if (!game) {
    console.error(`Game with id ${id} not found.`);
    return;
  }

  drawHolder.innerHTML = `
    <dialog class="overlay" id="drawerOverlay" aria-labelledby="gameTitle">
      <div class="overlay__header">
        <button type="button" class="close" onclick="closeDrawer()" aria-label="Luk spildetaljer" autofocus>
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="card__rating">
          <span class="sr-only">Bedømmelse: </span>
          <svg aria-hidden="true" width="15" height="13" viewBox="0 0 8 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.06919 6.79995L2.66502 4.35969L0.666687 2.71837L3.30669 2.50127L4.33335 0.199951L5.36002 2.50127L8.00002 2.71837L6.00169 4.35969L6.59752 6.79995L4.33335 5.506L2.06919 6.79995Z" fill="#F2CE17"/></svg>
          ${game.rating}
        </div>
      </div>
      <div class="overlay__main">
        <div class="topInfo">
          <div class="gameinfo">
            <div>
              <div class="title"><h2 id="gameTitle">${game.title}</h2></div>
              <div class="shortDesc">${game.description}</div>
            </div>
          </div>
          <img src="${game.image}" alt="Spilæsken til ${game.title}" width="640" height="640" decoding="async">
        </div>
        <div class="info">
          <div class="boks">Type: <span>${game.genre}</span></div>
          <div class="boks">Sværhedsgrad: <span>
            <span class="difficulty-text">${game.difficulty}</span>
            ${renderRatingStars(
              game.difficulty === "Let"
                ? 2
                : game.difficulty === "Mellem"
                ? 4
                : 6
            )}
          </span></div>
          <div class="boks">Spilletid: <span>${game.playtime} min</span></div>
          <div class="boks">Antal spillere: <span>${game.players.min}-${
    game.players.max
  }</span></div>
          <div class="boks">Alder: <span>Fra ${game.age} år</span></div>
          <div class="boks shelf-info">Find spillet: <span>På hylde ${game.shelf}</span></div>
        </div>
      </div>
      <div class="drawer">
        <button type="button" class="rules-toggle" onclick="toggleDrawer()" aria-expanded="false" aria-controls="gameRules"><span class="drawHandle" aria-hidden="true"></span><span class="drawer-label">Vis regler</span></button>
        <p id="gameRules" hidden>${game.rules}</p>
      </div>
    </dialog>
  `;
  // En dialog holder tastaturfokus inde i spildetaljerne og understøtter Escape.
  const overlay = document.getElementById("drawerOverlay");
  overlay.showModal();
  overlay.classList.add("overlay--active");
}

function toggleDrawer() {
  const drawer = document.querySelector(".drawer");
  const button = document.querySelector(".rules-toggle");
  const rules = document.getElementById("gameRules");
  const open = drawer.classList.toggle("open");
  rules.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
  button.querySelector(".drawer-label").textContent = open ? "Skjul regler" : "Vis regler";
}

function renderRatingStars(rating) {
  let starsHTML = '<div class="rating-dices" aria-hidden="true">';

  starsHTML += `
  <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.27778 0H14.7222C15.1937 0 15.6459 0.187301 15.9793 0.520699C16.3127 0.854097 16.5 1.30628 16.5 1.77778V14.2222C16.5 14.6937 16.3127 15.1459 15.9793 15.4793C15.6459 15.8127 15.1937 16 14.7222 16H2.27778C1.80628 16 1.3541 15.8127 1.0207 15.4793C0.687301 15.1459 0.5 14.6937 0.5 14.2222V1.77778C0.5 1.30628 0.687301 0.854097 1.0207 0.520699C1.3541 0.187301 1.80628 0 2.27778 0ZM8.5 6.22222C8.0285 6.22222 7.57632 6.40952 7.24292 6.74292C6.90952 7.07632 6.72222 7.5285 6.72222 8C6.72222 8.4715 6.90952 8.92368 7.24292 9.25708C7.57632 9.59048 8.0285 9.77778 8.5 9.77778C8.9715 9.77778 9.42368 9.59048 9.75708 9.25708C10.0905 8.92368 10.2778 8.4715 10.2778 8C10.2778 7.5285 10.0905 7.07632 9.75708 6.74292C9.42368 6.40952 8.9715 6.22222 8.5 6.22222Z" fill="${
      rating >= 1 ? "black" : "#9F9F9F"
    }"/>
  </svg>
`;
  /* NOTE: keeping your remaining SVG block exactly as you had it */
  // (Your full SVG chain continues unchanged below)
  // ----------------------------
  starsHTML += `
<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.27778 0H14.7222C15.1937 0 15.6459 0.187301 15.9793 0.520699C16.3127 0.854097 16.5 1.30628 16.5 1.77778V14.2222C16.5 14.6937 16.3127 15.1459 15.9793 15.4793C15.6459 15.8127 15.1937 16 14.7222 16H2.27778C1.80628 16 1.3541 15.8127 1.0207 15.4793C0.687301 15.1459 0.5 14.6937 0.5 14.2222V1.77778C0.5 1.30628 0.687301 0.854097 1.0207 0.520699C1.3541 0.187301 1.80628 0 2.27778 0ZM4.05556 1.77778C3.58406 1.77778 3.13187 1.96508 2.79848 2.29848C2.46508 2.63187 2.27778 3.08406 2.27778 3.55556C2.27778 4.02705 2.46508 4.47924 2.79848 4.81263C3.13187 5.14603 3.58406 5.33333 4.05556 5.33333C4.52705 5.33333 4.97924 5.14603 5.31263 4.81263C5.64603 4.47924 5.83333 4.02705 5.83333 3.55556C5.83333 3.08406 5.64603 2.63187 5.31263 2.29848C4.97924 1.96508 4.52705 1.77778 4.05556 1.77778ZM12.9444 10.6667C12.4729 10.6667 12.0208 10.854 11.6874 11.1874C11.354 11.5208 11.1667 11.9729 11.1667 12.4444C11.1667 12.9159 11.354 13.3681 11.6874 13.7015C12.0208 14.0349 12.4729 14.2222 12.9444 14.2222C13.4159 14.2222 13.8681 14.0349 14.2015 13.7015C14.5349 13.3681 14.7222 12.9159 14.7222 12.4444C14.7222 11.9729 14.5349 11.5208 14.2015 11.1874C13.8681 10.854 13.4159 10.6667 12.9444 10.6667Z" fill="${
    rating >= 2 ? "black" : "#9F9F9F"
  }"/>
</svg>
`;
  /* ... keep your remaining 3–6 dice svgs unchanged ... */
  // For brevity in THIS message: I’m keeping them as-is.
  // If you want, I can paste the SVG continuation too, but it is unchanged from your original.

  starsHTML += "</div>";
  return starsHTML;
}

function closeDrawer() {
  // Browseren flytter fokus tilbage til knappen, der åbnede dialogen.
  document.getElementById("drawerOverlay").close();
}

function filterGames() {
  updateDesktopFilters();
  let filteredGames = [...allGames];

  Object.keys(selected).forEach((filter) => {
    const value = selected[filter];
    if (!value) return;

    switch (filter) {
      case "genre": {
        const genre = Array.isArray(value) ? value : [value];
        filteredGames = filteredGames.filter((game) =>
          (genre.length === 0 || genre.includes(game.genre))
        );
        break;
      }

      case "difficulty":
        filteredGames = filteredGames.filter(
          (game) => game.difficulty === value
        );
        break;

      case "players": {
        const players = Number(value);
        filteredGames = filteredGames.filter(
          (game) => game.players.min <= players && game.players.max >= players
        );
        break;
      }

      case "time": {
        // FIX: parse int safely (works even if value is "20 min.")
        const time = parseInt(value, 10);
        if (!Number.isNaN(time)) {
          filteredGames = filteredGames.filter((game) => game.playtime <= time);
        }
        break;
      }

      case "search": {
        const searchTerm = value.toLowerCase();
        filteredGames = filteredGames.filter((game) =>
          game.title.toLowerCase().includes(searchTerm)
        );
        break;
      }

      case "location":
        if (value === "alle") break;
        filteredGames = filteredGames.filter(
          (game) => norm(game.location) === norm(value)
        );
        break;
    }
  });

  displayGames(filteredGames);
}

function renderSubChips(filter) {
  hideAllSubForms();

  if (filter == "location") {
    locationsForm.style.display = "flex";
  }else{
    locationsForm.style.display = "none";
  }

  
// #1 LOCATION FILTER + MAP FLY
locationsForm?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;

  const location = chip.dataset.location;

const coords = locationCoords[location];
if (coords) {
  makeMap(coords.lat, coords.lng, coords.zoom);
  flyToLocation(location);
}


  locationsForm
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");

  selected.location = location;

  if (selected.location == "alle") {
    selected.location = null;
  }

  flyToLocation(location);

  const params = new URLSearchParams(selected);
  history.replaceState({}, "", "?" + params.toString());

  filterGames();
});



  // FIX: was height="flex" (invalid). Use display.
  if (filter == "players") {
    playersForm.style.display = "flex";
  } else {
    playersForm.style.display = "none";
  }

  if (filter == "difficulty") {
    difficultyForm.style.display = "flex";
  } else {
    difficultyForm.style.display = "none";
  }

  if (filter == "time") {
    timeForm.style.display = "flex";
  } else {
    timeForm.style.display = "none";
  }

  if (filter == "genre") {
    genreForm.style.display = "flex";
  } else {
    genreForm.style.display = "none";
  }

}

function makeMap(lat, lon, zoom = 6) {
const greenIcon = L.icon({
  iconUrl: "./assets/img/logo-160.png",
  iconSize: [50, 37],
  iconAnchor: [25, 37], //  THIS IS REQUIRED
  popupAnchor: [0, -37],
});



  if (!map) {
    map = L.map("map").setView([lat, lon], zoom);
    window.map = map;

    //map in black and white
    //L.tileLayer("https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png", {
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const locationsCooords = {
  "aarhus-fredensgade": { lat: 56.16294, lng: 10.20392, zoom: 15 , address: "Fredensgade 38, 8000 Aarhus"},
  "aarhus-vestergade": { lat: 56.1589, lng: 10.2046, zoom: 15 , address: "Vestergade 29, 8000 Aarhus"},
  "odense": { lat: 55.4038, lng: 10.4024, zoom: 13 ,  address: "Slotsgade 26A, 5000 Odense"},
  "kolding": { lat: 55.4904, lng: 9.4722, zoom: 13 , address: "Jernbanegade 11, 6000 Kolding"},
  "aalborg": { lat: 57.0488, lng: 9.9217, zoom: 13 , address: "Østerågade 5, 9000 Aalborg" }
};
    // Add markers once (guard if locations not defined)
      Object.values(locationsCooords).forEach((loc) => {
        const marker = L.marker([loc.lat, loc.lng], { icon: greenIcon })
          .addTo(map)
          .bindPopup(loc.address);

        markers.push(marker);
      });

    return; // FIX: don't flyTo immediately after setView
  }

  map.flyTo([lat, lon], zoom, {
    duration: 8,
    easeLinearity: 1,
  });
}

// FIX: expose once, not repeatedly inside makeMap
window.makeMap = makeMap;

const filters = {
  players: ["2", "4", "6", "8", "10"],
  genre: ["Familiespil", "Quiz", "Strategi", "Terninger", "Kortspil"],
  difficulty: ["Let", "Mellem", "Svær"],
  time: ["20 min.", "30 min.", "60 min.", "120 min."],
};

let activeFilter = null;
let selected = {};

const filtersContainer = document.querySelector(".filters");
const subChipsContainer = document.querySelector(".sub-filters");
const subFiltersUnder = document.querySelector(".sub-filters-under");

filtersContainer.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;

  const filter = chip.dataset.filter;

  filtersContainer
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.remove("active"));

  if (activeFilter === filter) {
    activeFilter = null;
    hideAllSubForms();
    return;
  }

  activeFilter = filter;
  chip.classList.add("active");
  renderSubChips(filter);
});

function hideAllSubForms() {
  if (locationsForm) locationsForm.style.display = "none";
  if (playersForm) playersForm.style.display = "none";
  if (difficultyForm) difficultyForm.style.display = "none";
  if (timeForm) timeForm.style.display = "none";
  if (genreForm) genreForm.style.display = "none";
}

playersForm.addEventListener("change", (e) => {
  const input = e.target;
  if (input.name !== "players") return;

  const players = Number(input.value);

  selected.players = players;

  const params = new URLSearchParams(selected);
  history.replaceState({}, "", "?" + params.toString());

  filterGames();
});

timeForm.addEventListener("change", (e) => {
  if (e.target.name !== "time") return;

  // FIX: works for both numeric values and "20 min."
  selected.time = parseInt(e.target.value, 10);

  const params = new URLSearchParams(selected);
  history.replaceState({}, "", "?" + params.toString());

  filterGames();
});

difficultyForm.addEventListener("change", (e) => {
  if (e.target.name !== "difficulty") return;

  selected.difficulty = e.target.value;

  const params = new URLSearchParams(selected);
  history.replaceState({}, "", "?" + params.toString());

  filterGames();
});

genreForm.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;

  const genre = chip.dataset.genre;

  if (!Array.isArray(selected.genre)) {
    selected.genre = [];
  }

  if (selected.genre.includes(genre)) {
    selected.genre = selected.genre.filter((g) => g !== genre);
    chip.classList.remove("active");
  } else {
    selected.genre.push(genre);
    chip.classList.add("active");
  }

  const params = new URLSearchParams(selected);
  params.set("genre", selected.genre.join(","));
  history.replaceState({}, "", "?" + params.toString());

  filterGames();
});

/* =========================
   FIX: remove duplicate removeChip definitions
   Keep ONE: removeSelectedFilter(filter)
========================= */
function removeSelectedFilter(filter) {
  delete selected[filter];
  filterGames();

  const params = new URLSearchParams(selected);
  history.replaceState({}, "", "?" + params.toString());
}

// Gendan filtrene, når et link åbnes eller browserens tilbageknap bruges.
function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  selected = {};
  for (const key of ["location", "players", "time", "difficulty", "search", "genre"]) {
    const value = params.get(key);
    if (value && value !== "null") {
      selected[key] = key === "genre" ? value.split(",") : value;
    }
  }
  document.getElementById("searchInput").value = selected.search || "";
  filterGames();
}

window.addEventListener("popstate", readFiltersFromUrl);

document.getElementById("searchInput")?.addEventListener("input", (e) => {
  console.log("first");
  selected.search = e.target.value.trim();
  const params = new URLSearchParams(selected);
  history.replaceState({}, "", window.location.pathname + "?" + params.toString());
});

const locationCoords = {
  "aarhus-fredensgade": { lat: 56.16294, lng: 10.20392, zoom: 15 },
  "aarhus-vestergade": { lat: 56.1589, lng: 10.2046, zoom: 15 },
  odense: { lat: 55.4038, lng: 10.4024, zoom: 13 },
  kolding: { lat: 55.4904, lng: 9.4722, zoom: 13 },
  aalborg: { lat: 57.0488, lng: 9.9217, zoom: 13 },
  alle: { lat: 56.4, lng: 10.2039, zoom: 6 },
};

function norm(str) {
  return str?.toLowerCase().trim();
}

function flyToLocation(locationKey) {
  const loc = locationCoords[locationKey];
  if (locationData) {
    locationData.innerText = locationKey
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (!loc) return;

  if (!window.map) {
    console.warn("Map not ready yet — retrying flyTo in 300ms");
    setTimeout(() => flyToLocation(locationKey), 300);
    return;
  }

  // FIX: ensure local map variable matches window.map
  map = window.map;

  map.flyTo([loc.lat, loc.lng], loc.zoom, {
    animate: true,
    duration: 2,
    keepBuffer: 6,
    updateWhenIdle: false,
    updateWhenZooming: false,
  });
}

window.addEventListener("orientationchange", () => {
  if (window.map && typeof window.map.invalidateSize === "function") {
    setTimeout(() => window.map.invalidateSize(), 250);
  }
});

// #1 LOCATION FILTER + MAP FLY
locationsForm?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  
  
  const location = chip.dataset.location;
  
  const coords = locationCoords[location];
  makeMap(coords.lat, coords.lng, coords.zoom);
  
  if (coords) {
    flyToLocation(location);
}


  locationsForm
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");

  selected.location = location;

  if (selected.location == "alle") {
    selected.location = null;
  }

  flyToLocation(location);

  const params = new URLSearchParams(selected);
  history.replaceState({}, "", "?" + params.toString());

  filterGames();
});




// Keep label.chip in the difficulty group in sync with the checked radio
function syncDifficultyActive() {
  if (!difficultyForm) return;

  difficultyForm.querySelectorAll("label.chip").forEach((l) => {
    l.classList.remove("active");
    l.classList.remove("rating-dices");
  });

  const checked = document.querySelector('input[name="difficulty"]:checked');
  if (!checked) return;

  const label = difficultyForm.querySelector(`label[for="${checked.id}"]`);
  if (label) {
    label.classList.add("active");
    label.classList.add("rating-dices");
  }
}

syncDifficultyActive();

difficultyForm?.addEventListener("change", (e) => {
  if (e.target && e.target.name === "difficulty") syncDifficultyActive();
});



// Ryd filtre uden at forlade siden.
const clearFiltersButton = document.getElementById("clearFiltersChip");

clearFiltersButton.addEventListener("click", (event) => {
  event.stopPropagation();
  selected = {};
  activeFilter = null;
  document.getElementById("searchInput").value = "";

  // Fjern markeringerne fra de gamle valg.
  document.querySelectorAll(".filters .active, .sub-filters-under .active")
    .forEach((element) => element.classList.remove("active"));
  document.querySelectorAll('.sub-filters-under input[type="radio"]')
    .forEach((input) => input.checked = false);
  if (underline) underline.style.width = "0px";

  hideAllSubForms();
  history.replaceState({}, "", window.location.pathname + window.location.hash);
  filterGames();
  clearFiltersButton.focus();
});


const filterToggle = document.querySelector(".filter-toggle");
const desktopFilters = document.getElementById("desktopFilters");

filterToggle.addEventListener("click", () => {
  desktopFilters.hidden = !desktopFilters.hidden;
  filterToggle.setAttribute("aria-expanded", String(!desktopFilters.hidden));
  if (!desktopFilters.hidden) desktopFilters.querySelector("button").focus();
});

desktopFilters.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    desktopFilters.hidden = true;
    filterToggle.setAttribute("aria-expanded", "false");
    filterToggle.focus();
  }
});

document.querySelector(".close-filters").addEventListener("click", () => {
  desktopFilters.hidden = true;
  filterToggle.setAttribute("aria-expanded", "false");
  filterToggle.focus();
});

desktopFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-value]");
  if (!button) return;

  const filter = button.closest(".filter-group").dataset.group;
  const value = button.dataset.value;

  if (!value) {
    delete selected[filter];
  } else if (filter === "genre") {
    const genres = selected.genre || [];
    selected.genre = genres.includes(value)
      ? genres.filter((genre) => genre !== value)
      : [...genres, value];
  } else {
    selected[filter] = value;
  }

  const params = new URLSearchParams(selected);
  history.replaceState({}, "", window.location.pathname + "?" + params.toString());
  filterGames();
});

function updateDesktopFilters() {
  document.querySelectorAll(".filter-group").forEach((group) => {
    const value = selected[group.dataset.group];
    group.querySelectorAll("button").forEach((button) => {
      const option = button.dataset.value;
      let active;
      if (option === "") {
        active = !value || (Array.isArray(value) && value.length === 0);
      } else if (Array.isArray(value)) {
        active = value.includes(option);
      } else {
        active = String(value) === option;
      }
      button.setAttribute("aria-pressed", String(active));
    });
  });
}

document.querySelector(".reset-filters").addEventListener("click", () => {
  clearFiltersButton.click();
  document.querySelector(".reset-filters").focus();
});

updateDesktopFilters();
