const MENU = {
  base:    ["Black tea", "Green tea", "Taro", "Matcha", "Thai tea", "Chamomile tea", "Peppermint tea"],
  milk:    ["Whole milk", "Oat milk", "No milk"],
  sugar:   ["0% sugar", "50% sugar", "100% sugar"],
  topping: ["Tapioca pearls", "Lychee jelly", "Pudding", "Popping boba"],
  ice:     ["No ice", "Less ice", "Regular"],
};
// each named drink fixes base, milk, topping — customers pick sugar & ice
const RECIPES = {
  "Classic Milk Tea": { base: "Black tea",      milk: "Whole milk", topping: "Tapioca pearls" },
  "Taro Dream":       { base: "Taro",           milk: "Oat milk",   topping: "Pudding" },
  "Matcha Latte":     { base: "Matcha",         milk: "Oat milk",   topping: "Tapioca pearls" },
  "Thai Sunset":      { base: "Thai tea",       milk: "Whole milk", topping: "Popping boba" },
  "Green Garden":     { base: "Green tea",      milk: "No milk",    topping: "Lychee jelly" },
  "Chamomile Calm":   { base: "Chamomile tea",  milk: "No milk",    topping: "Pudding" },
  "Mint Breeze":      { base: "Peppermint tea", milk: "No milk",    topping: "Lychee jelly" },
"Green Pearl Tea":  { base: "Green tea",      milk: "No milk",    topping: "Tapioca pearls" },
};  
// ---- progression (saved between sessions) ----
// ingredients that can be bought; price 0 = you start with it
const SHOP = {
  "Black tea":      { level: 1, price: 0 },
  "Green tea":      { level: 1, price: 0 },
  "Whole milk":     { level: 1, price: 0 },
  "No milk":        { level: 1, price: 0 },
  "Tapioca pearls": { level: 1, price: 0 },
  "Oat milk":       { level: 2, price: 30 },
  "Taro":           { level: 2, price: 40 },
  "Lychee jelly":   { level: 3, price: 50 },
  "Matcha":         { level: 3, price: 60 },
  "Pudding":        { level: 4, price: 70 },
  "Thai tea":       { level: 4, price: 80 },
  "Chamomile tea":  { level: 5, price: 90 },
  "Popping boba":   { level: 5, price: 100 },
  "Peppermint tea": { level: 6, price: 120 },
};
// sugar and ice aren't in SHOP, so they're always available

function xpNeeded(level) {
  return level * 40; // XP needed to go from this level to the next
}

function loadProgress() {
  const starter = Object.keys(SHOP).filter(item => SHOP[item].price === 0);
  try {
    const saved = JSON.parse(localStorage.getItem("bobaProgress"));
    if (saved) return saved;
  } catch { /* storage blocked or broken → start fresh */ }
  return { level: 1, xp: 0, wallet: 0, owned: starter };
}

function saveProgress() {
  try { localStorage.setItem("bobaProgress", JSON.stringify(progress)); }
  catch { /* storage blocked — game still works, just no saving */ }
}

let progress = loadProgress();

function isOwned(item) {
  return !(item in SHOP) || progress.owned.includes(item);
}

function reward(coinsEarned, xpEarned) {
  progress.wallet += coinsEarned;
  progress.xp += xpEarned;

  let leveledUp = false;
  while (progress.xp >= xpNeeded(progress.level)) {
    progress.xp -= xpNeeded(progress.level);
    progress.level++;
    leveledUp = true;
  }
  if (leveledUp) showLevelUp(progress.level);

  saveProgress();
  renderProgress();
}
let levelUpTimer;

function showLevelUp(level) {
  // items that just became buyable at this level
  const newItems = Object.keys(SHOP).filter(
    item => SHOP[item].level === level && SHOP[item].price > 0
  );

  const el = document.getElementById("levelup");
  el.innerHTML = `
    <div class="lv-star">⭐</div>
    <div class="lv-title">Level up!</div>
    <div class="lv-num">You're now level ${level}</div>
    ${newItems.length
      ? `<div class="lv-new">New in the shop:<br><b>${newItems.join(", ")}</b></div>`
      : ""}`;

  el.classList.add("show");
  el.onclick = () => el.classList.remove("show"); // click to close early

  clearTimeout(levelUpTimer); // restart the 3s timer if it was already open
  levelUpTimer = setTimeout(() => el.classList.remove("show"), 3000);
}

function renderProgress() {
  document.getElementById("level").textContent = progress.level;
  document.getElementById("xpfill").style.width =
    (progress.xp / xpNeeded(progress.level)) * 100 + "%";
}
// only the ingredients you own, for one category
function available(key) {
  return MENU[key].filter(isOwned);
}

// only recipes whose ingredients you own
function unlockedRecipes() {
  return Object.keys(RECIPES).filter(name => {
    const r = RECIPES[name];
    return isOwned(r.base) && isOwned(r.milk) && isOwned(r.topping);
  });
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CUSTOM_CHANCE = 0.3; // 30% of customers order a custom drink

function randomOrder() {
  if (Math.random() < CUSTOM_CHANCE) {
    const order = { name: "Custom" };
    for (const key in MENU) order[key] = pick(available(key));
    return order;
  }

  const name = pick(unlockedRecipes());
  return {
    name,
    ...RECIPES[name],
    sugar: pick(MENU.sugar),
    ice:   pick(MENU.ice),
  };
}


// ---- state ----
let cup = {};

// ---- cup drawing ----
const BASE_COLORS = {
  "Black tea":      "#8b4a1c",
  "Green tea":      "#b5c94a",
  "Taro":           "#a88bd1",
  "Matcha":         "#5f9e3a",
  "Thai tea":       "#e8883a",
  "Chamomile tea":  "#e9c46a",
  "Peppermint tea": "#9fd8b0",
};
const TOPPING_CLASS = {
  "Tapioca pearls": "pearl",
  "Lychee jelly":   "jelly",
  "Pudding":        "pudding",
  "Popping boba":   "popping",
};
const SUGAR_LEVEL = { "0% sugar": 0, "50% sugar": 0.5, "100% sugar": 1 };
const ICE_COUNT = { "No ice": 0, "Less ice": 2, "Regular": 4 };
const ICONS = {
  "Whole milk": "🥛", "Oat milk": "🌾", "No milk": "🚫",
  "0% sugar": "🚫", "50% sugar": "🍬", "100% sugar": "🍬🍬",
  "Tapioca pearls": "⚫", "Lychee jelly": "🟨", "Pudding": "🍮", "Popping boba": "🟠",
  "No ice": "🚫", "Less ice": "🧊", "Regular": "🧊🧊",
};
let shown = {}; // what the cup is currently drawing

function buildCup() {
  document.getElementById("cup").innerHTML = `
    <div class="cup">
      <div class="liquid"></div>
      <div class="syrup"></div>
      <div class="milk"></div>
      <div class="toppings"></div>
      <div class="ice"></div>
    </div>
    <div class="cup-label"></div>`;
}

function renderCup() {
  const liquid = document.querySelector(".liquid");
  const milk = document.querySelector(".milk");
  const syrup = document.querySelector(".syrup");
  const hasMilk = cup.milk && cup.milk !== "No milk";

  // tea pours in (or drains out on trash)
  const filled = cup.base || hasMilk;
  liquid.style.height = filled ? "70%" : "0";
  liquid.style.background = cup.base ? BASE_COLORS[cup.base] : "#f5efe6";

  // milk swirls in on top of the tea
  milk.style.height = liquid.style.height;
  milk.style.opacity = hasMilk ? 1 : 0;

  // brown sugar syrup streaks up from the bottom
  syrup.style.height = cup.sugar ? "40%" : "0";
  syrup.style.opacity = SUGAR_LEVEL[cup.sugar] || 0;

  // only re-drop things that actually changed
  if (cup.topping !== shown.topping) dropToppings(cup.topping);
  if (cup.ice !== shown.ice) dropIce(cup.ice);
  shown = { ...cup };

  const parts = Object.keys(MENU).map(key => `${key}: ${cup[key] || "—"}`);
  document.querySelector(".cup-label").textContent = parts.join(" | ");
// highlight the chosen button in each row
  for (const b of document.querySelectorAll(".ing")) {
    b.classList.toggle("selected", cup[b.dataset.key] === b.dataset.item);
  }
}

function dropToppings(topping) {
  const box = document.querySelector(".toppings");
  box.innerHTML = "";
  if (!topping) return;
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    p.className = "piece " + TOPPING_CLASS[topping];
    p.style.left = 5 + Math.random() * 80 + "%";
    p.style.bottom = 3 + Math.random() * 20 + "px";
    p.style.animationDelay = i * 0.05 + "s";
    box.appendChild(p);
  }
}

function dropIce(ice) {
  const box = document.querySelector(".ice");
  box.innerHTML = "";
  const n = ICE_COUNT[ice] || 0;
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "cube";
    c.style.left = 8 + i * 22 + "%";
    c.style.animationDelay = i * 0.1 + "s";
    box.appendChild(c);
  }
}

// ---- station buttons ----
function renderStation() {
  const station = document.getElementById("station");
  station.innerHTML = "";

  for (const key in MENU) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<span class="row-label">${key}</span>`;

    for (const item of available(key)) {
      const btn = document.createElement("button");
      btn.className = "ing";
      btn.dataset.key = key;   // remembered so we can highlight it later
      btn.dataset.item = item;
      const icon = key === "base"
        ? `<span class="dot" style="background:${BASE_COLORS[item]}"></span>`
        : `<span class="icon">${ICONS[item] || ""}</span>`;
      btn.innerHTML = icon + item;
      btn.onclick = () => {
        cup[key] = item;
        renderCup();
      };
      row.appendChild(btn);
    }
    station.appendChild(row);
  }

  // trash + serve now sit under the cup
  const actions = document.getElementById("actions");
  actions.innerHTML = "";

  const trash = document.createElement("button");
  trash.textContent = "🗑 Trash";
  trash.onclick = () => {
    cup = {};
    renderCup();
  };
  actions.appendChild(trash);

  const serveBtn = document.createElement("button");
  serveBtn.className = "serve";
  serveBtn.textContent = "🧋 Serve";
  serveBtn.onclick = serve;
  actions.appendChild(serveBtn);
}
//---recipes---
function renderRecipes() {
  let html = `
    <button class="close" onclick="toggleMenu()">✕</button>
    <h3>📖 Menu</h3>`;

  for (const name of unlockedRecipes()) {
    const r = RECIPES[name];
    html += `
      <div class="recipe">
        <span class="swatch" style="background:${BASE_COLORS[r.base]}"></span>
        <div><b>${name}</b><br>${r.base}<br>${r.milk} · ${r.topping}</div>
      </div>`;
  }

  const locked = Object.keys(RECIPES).length - unlockedRecipes().length;
  if (locked > 0) {
    html += `<p class="recipe-note">🔒 ${locked} more recipes — buy ingredients in the shop to unlock them.</p>`;
  }

  html += `<p class="recipe-note">Sugar & ice: whatever the customer asks for.<br>
           Purple cards are custom orders, so follow their list.</p>`;
  document.getElementById("recipes").innerHTML = html;
}

function toggleMenu() {
  document.getElementById("recipes").classList.toggle("open");
}

// ---- customers ----
const PATIENCE_MS = 40000;  // each customer waits 40 seconds
const SPAWN_MS = 9000;      // a new customer every 9 seconds
const MAX_CUSTOMERS = 3;

let customers = [];

function spawnCustomer() {
  if (!running || customers.length >= MAX_CUSTOMERS) return;
  const c = { order: randomOrder(), arrivedAt: Date.now() };
  const o = c.order;
  const isCustom = o.name === "Custom";
  const details = isCustom
    ? `<b>Custom</b><br>${o.base}<br>${o.milk}<br>${o.topping}<br>${o.sugar}<br>${o.ice}`
    : `<b>${o.name}</b><br>${o.sugar}<br>${o.ice}`;

  c.el = document.createElement("div");
  c.el.className = "customer arriving" + (isCustom ? " custom" : "");
  c.el.innerHTML = `
    <div class="face">😊</div>
    <div class="order">${details}</div>
    <div class="patience"><div class="patience-fill"></div></div>`;

  customers.push(c);
  document.getElementById("counter").appendChild(c.el);
}

function customerLeaves(c, happy) {
  customers = customers.filter(x => x !== c);
  c.el.querySelector(".face").textContent = happy ? "😄" : "😠";
  c.el.classList.add(happy ? "leaving-happy" : "leaving-angry");
  setTimeout(() => c.el.remove(), 600);
}

// runs 10 times per second: clock, patience, faces
function tick() {
  if (!running) return;
  const now = Date.now();

  const remaining = shiftEndsAt - now;
  if (remaining <= 0) {
    endShift();
    return;
  }
  updateClock(remaining);

  for (const c of [...customers]) {
    const left = 1 - (now - c.arrivedAt) / PATIENCE_MS; // 1 = full, 0 = gone

    if (left <= 0) {
      lost++;
      customerLeaves(c, false);
      showMessage("A customer got tired of waiting 😤");
      continue;
    }

    const fill = c.el.querySelector(".patience-fill");
    fill.style.width = left * 100 + "%";
    fill.style.background = left > 0.5 ? "#6cc070" : left > 0.25 ? "#f2c14e" : "#e05a47";
    c.el.querySelector(".face").textContent = left > 0.5 ? "😊" : left > 0.25 ? "😐" : "😠";
    c.el.classList.toggle("current", c === customers[0]); // highlight front of line
  }
}

// ---- serving ----
let coins = 0;
let serving = false; // blocks double-clicking Serve

function serve() {
  if (serving) return;
  const customer = customers[0];
  if (!customer) {
    showMessage("No customers yet!");
    return;
  }
  if (Object.keys(cup).length === 0) {
    showMessage("The cup is empty!");
    return;
  }

  // compare the cup to the order, category by category
  let matches = 0;
  const total = Object.keys(MENU).length;
  for (const key in MENU) {
    if (cup[key] === customer.order[key]) matches++;
  }

  // 2 coins per correct part, +5 bonus for a perfect drink
  let earned = matches * 2;
  if (matches === total) earned += 5;
  coins += earned;
  document.getElementById("coins").textContent = coins;

  showMessage(matches === total
    ? `Perfect! +${earned} coins 🎉`
    : `${matches}/${total} correct. +${earned} coins`);
  customerLeaves(customer, true);
  served++;
  reward(earned, matches + (matches === total ? 5 : 0)); // coins → wallet, XP → level

  // slide the cup away
  serving = true;
  const cupEl = document.querySelector(".cup");
  cupEl.classList.remove("fresh");
  cupEl.classList.add("served");

  setTimeout(() => {
    // empty the cup instantly while it's invisible (no draining animation)
    cupEl.classList.add("instant");
    cup = {};
    renderCup();
    cupEl.offsetHeight; // forces the browser to apply the reset now
    cupEl.classList.remove("instant", "served");
    cupEl.classList.add("fresh"); // new cup pops in
    serving = false;
  }, 600);
}

function showMessage(text) {
  const m = document.getElementById("message");
  m.textContent = text;
  m.classList.remove("pop");
  m.offsetHeight; // restart the animation even if the class was already there
  m.classList.add("pop");
}

// ---- shift ----
const SHIFT_MS = 180000; // 3 minutes
let running = false;
let shiftEndsAt = 0;
let served = 0;
let lost = 0;
function loadBest() {
  try { return Number(localStorage.getItem("bobaBest")) || 0; }
  catch { return 0; }
}

function saveBest(n) {
  try { localStorage.setItem("bobaBest", n); }
  catch { /* storage blocked — game still works, just no saving */ }
}
function showOverlay(html) {
  const o = document.getElementById("overlay");
  o.innerHTML = `<div class="panel">${html}</div>`;
  o.classList.add("show");
}

function hideOverlay() {
  document.getElementById("overlay").classList.remove("show");
}
function showShop() {
  let rows = "";
  for (const item in SHOP) {
    const s = SHOP[item];
    if (s.price === 0) continue; // starter items aren't sold

    let action;
    if (isOwned(item)) {
      action = `<span class="owned">✓ Owned</span>`;
    } else if (progress.level < s.level) {
      action = `<span class="locked">🔒 Level ${s.level}</span>`;
    } else {
      const tooPoor = progress.wallet < s.price ? "disabled" : "";
      action = `<button onclick="buy('${item}')" ${tooPoor}>🪙 ${s.price}</button>`;
    }
    rows += `<div class="shop-row"><span>${item}</span>${action}</div>`;
  }

  showOverlay(`
    <h1>🛒 Shop</h1>
    <p>Level <b>${progress.level}</b> · Wallet 🪙 <b>${progress.wallet}</b></p>
    <div class="shop-list">${rows}</div>
    <button onclick="showStartScreen()">Back</button>`);
}

function buy(item) {
  const s = SHOP[item];
  if (isOwned(item) || progress.level < s.level || progress.wallet < s.price) return;

  progress.wallet -= s.price;
  progress.owned.push(item);
  saveProgress();

  renderStation();  // new ingredient button appears
  renderRecipes();  // new recipes may unlock
  showShop();       // redraw with the updated wallet
}
function showStartScreen() {
  showOverlay(`
    <h1>🧋 Boba Bobyyy</h1>
    <p>Match each drink to the order.<br>
       Serve the outlined customer before their patience runs out!</p>
    <p>Level <b>${progress.level}</b> · Wallet 🪙 <b>${progress.wallet}</b></p>
    <p>High score: <b>${loadBest()}</b></p>
    <button onclick="showShop()">🛒 Shop</button>
    <button onclick="startShift()">Start shift</button>`);
}

function startShift() {
  // reset everything from the last round
  coins = 0;
  served = 0;
  lost = 0;
  document.getElementById("coins").textContent = 0;
  document.getElementById("message").textContent = "";
  for (const c of customers) c.el.remove();
  customers = [];
  cup = {};
  renderCup();

  running = true;
  shiftEndsAt = Date.now() + SHIFT_MS;
  updateClock(SHIFT_MS);
  hideOverlay();
  spawnCustomer();
}

function endShift() {
  running = false;
  for (const c of [...customers]) customerLeaves(c, false);

  const rating = served === 0 ? "😬" : lost === 0 ? "⭐⭐⭐" : lost <= 2 ? "⭐⭐" : "⭐";
  const best = loadBest();
  const isNew = coins > best;
  if (isNew) saveBest(coins);

  showOverlay(`
    <h1>Shift over!</h1>
    <p class="big">${rating}</p>
    <p>Coins earned: <b>${coins}</b></p>
    <p>Customers served: <b>${served}</b></p>
    <p>Customers lost: <b>${lost}</b></p>
    <p>${isNew ? "🏆 New high score!" : `High score: <b>${best}</b>`}</p>
    <button onclick="showShop()">🛒 Shop</button>
    <button onclick="startShift()">Play again</button>`);
}

function updateClock(ms) {
  const s = Math.ceil(ms / 1000);
  const el = document.getElementById("time");
  el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  el.classList.toggle("hurry", s <= 20);
}

// ---- start ----
renderStation();
renderRecipes();
renderProgress();
document.getElementById("menuBtn").onclick = toggleMenu;
document.addEventListener("keydown", e => { if (e.key === "m") toggleMenu(); });
buildCup();
renderCup();

showStartScreen();
setInterval(spawnCustomer, SPAWN_MS);
setInterval(tick, 100);