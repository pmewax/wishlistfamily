import { createWishlist, getWishlist, addItem, deleteItem, setReservation } from "./api.js";
import { FancyDropdown } from "./dropdown.js";

const qs = new URLSearchParams(window.location.search);
const wishlistId = qs.get("wishlist");
const ownerToken = qs.get("owner");

const state = {
  theme: localStorage.getItem("wishlist_theme") || "dark",
  mode: wishlistId ? (ownerToken ? "owner" : "friend") : "create",
  wishlist: null,
  activeMemberId: ""
};

const occasionOptions = [
  { value: "birthday", label: "🎂 День рождения" },
  { value: "wedding", label: "💍 Свадьба" },
  { value: "newyear", label: "🎄 Новый год" },
  { value: "march8", label: "🌷 8 Марта" },
  { value: "feb23", label: "🎖️ 23 Февраля" },
  { value: "housewarming", label: "🏡 Новоселье" },
  { value: "anniversary", label: "✨ Юбилей" },
  { value: "other", label: "🪄 Другое" }
];

const setupScreen = document.getElementById("setupScreen");
const wishlistScreen = document.getElementById("wishlistScreen");
const ownerTools = document.getElementById("ownerTools");
const friendNote = document.getElementById("friendNote");

const setupTitle = document.getElementById("setupTitle");
const customOccasionField = document.getElementById("customOccasionField");
const customOccasionInput = document.getElementById("customOccasionInput");
const memberNameInput = document.getElementById("memberNameInput");
const membersList = document.getElementById("membersList");
const createWishlistBtn = document.getElementById("createWishlistBtn");
const addMemberBtn = document.getElementById("addMemberBtn");

const listTitleView = document.getElementById("listTitleView");
const occasionView = document.getElementById("occasionView");
const itemTitleInput = document.getElementById("itemTitleInput");
const itemUrlInput = document.getElementById("itemUrlInput");
const itemImgInput = document.getElementById("itemImgInput");
const addGiftBtn = document.getElementById("addGiftBtn");
const friendLinkInput = document.getElementById("friendLinkInput");
const copyLinkBtn = document.getElementById("copyLinkBtn");

const occasionChip = document.getElementById("occasionChip");
const listHeader = document.getElementById("listHeader");
const listDescription = document.getElementById("listDescription");
const memberTabs = document.getElementById("memberTabs");
const itemsBox = document.getElementById("itemsBox");
const emptyState = document.getElementById("emptyState");
const themeToggle = document.getElementById("themeToggle");

const draftMembers = [];

const occasionDropdown = new FancyDropdown({
  mount: document.getElementById("occasionDropdown"),
  placeholder: "Выбери праздник",
  options: occasionOptions,
  onChange: (value) => {
    customOccasionField.classList.toggle("hidden", value !== "other");
  }
});

const memberDropdown = new FancyDropdown({
  mount: document.getElementById("memberDropdown"),
  placeholder: "Выбери участника",
  options: [],
  onChange: (value) => {
    state.activeMemberId = value;
    render();
  }
});

function applyTheme() {
  document.body.classList.toggle("light", state.theme === "light");
  themeToggle.textContent = state.theme === "light" ? "☀️" : "🌙";
  localStorage.setItem("wishlist_theme", state.theme);
}

function fallbackImage(title = "Подарок") {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f2a54"/>
          <stop offset="100%" stop-color="#4b205f"/>
        </linearGradient>
        <linearGradient id="gift" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff9bc0"/>
          <stop offset="100%" stop-color="#ff6ca0"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" rx="36" fill="url(#bg)"/>
      <rect x="255" y="165" width="290" height="175" rx="24" fill="url(#gift)"/>
      <rect x="383" y="130" width="34" height="210" rx="14" fill="#ffd86d"/>
      <rect x="255" y="237" width="290" height="32" rx="16" fill="#ffd86d"/>
      <text x="400" y="420" text-anchor="middle" fill="#f7e8ff" font-size="34" font-family="Arial" font-weight="700">
        ${String(title).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </text>
    </svg>
  `)}`;
}

function renderDraftMembers() {
  membersList.innerHTML = "";

  draftMembers.forEach((member, index) => {
    const el = document.createElement("div");
    el.className = "member-pill";
    el.innerHTML = `
      <span>${member}</span>
      <button type="button" data-index="${index}">×</button>
    `;
    membersList.appendChild(el);
  });

  membersList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      draftMembers.splice(Number(btn.dataset.index), 1);
      renderDraftMembers();
    });
  });
}

function getMemberItems(memberId) {
  return state.wishlist.items.filter((item) => item.memberId === memberId);
}

function createBadge(reserved) {
  const badge = document.createElement("div");
  badge.className = `badge ${reserved ? "badge--warning" : "badge--success"}`;
  badge.textContent = reserved ? "Уже занят" : "Свободен";
  return badge;
}

function createCard(item, memberName) {
  const row = document.createElement("div");
  row.className = "item-card";

  const image = document.createElement("img");
  image.className = "item-card__image";
  image.src = item.img || fallbackImage(item.title);
  image.alt = item.title;
  image.addEventListener("error", () => {
    image.src = fallbackImage(item.title);
  });

  const content = document.createElement("div");
  content.innerHTML = `
    <div class="item-card__title">${item.title}</div>
    <div class="item-card__owner">Для: ${memberName}</div>
    ${item.url ? `<div class="item-card__link"><a href="${item.url}" target="_blank" rel="noreferrer">${item.url}</a></div>` : ""}
  `;

  const right = document.createElement("div");
  right.className = "item-card__right";
  right.appendChild(createBadge(item.reserved));

  if (state.mode === "friend") {
    const button = document.createElement("button");
    button.className = item.reserved ? "btn--unreserve" : "btn--reserve";
    button.textContent = item.reserved ? "Снять бронь" : "Забронировать";

    button.addEventListener("click", async () => {
      try {
        await setReservation(state.wishlist.id, item.itemId, !item.reserved);
        await loadWishlist();
      } catch (error) {
        alert(error.message);
      }
    });

    right.appendChild(button);
  }

  if (state.mode === "owner") {
    const button = document.createElement("button");
    button.className = "btn--delete";
    button.textContent = "Удалить";

    button.addEventListener("click", async () => {
      try {
        await deleteItem(state.wishlist.id, item.itemId, ownerToken);
        await loadWishlist();
      } catch (error) {
        alert(error.message);
      }
    });

    right.appendChild(button);
  }

  row.append(image, content, right);
  return row;
}

function renderMemberTabs() {
  memberTabs.innerHTML = "";

  state.wishlist.members.forEach((member) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `member-tab ${member.memberId === state.activeMemberId ? "active" : ""}`;
    btn.textContent = `${member.name} (${getMemberItems(member.memberId).length})`;

    btn.addEventListener("click", () => {
      state.activeMemberId = member.memberId;
      if (state.mode === "owner") {
        memberDropdown.setValue(member.memberId, member.name);
      }
      render();
    });

    memberTabs.appendChild(btn);
  });
}

function renderItems() {
  itemsBox.innerHTML = "";

  const activeMember = state.wishlist.members.find((m) => m.memberId === state.activeMemberId);

  if (!activeMember) {
    emptyState.classList.remove("hidden");
    return;
  }

  const items = getMemberItems(activeMember.memberId);

  if (items.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.querySelector(".empty-state__title").textContent = "Пока пусто";
    emptyState.querySelector(".empty-state__text").textContent =
      state.mode === "owner"
        ? "Добавь первый подарок для выбранного участника."
        : "У этого участника пока нет подарков.";
    return;
  }

  emptyState.classList.add("hidden");

  items.forEach((item) => {
    itemsBox.appendChild(createCard(item, activeMember.name));
  });
}

function renderOwner() {
  ownerTools.classList.remove("hidden");
  friendNote.classList.add("hidden");

  listTitleView.value = state.wishlist.title;
  occasionView.value = state.wishlist.occasionLabel;

  const memberOptions = state.wishlist.members.map((m) => ({
    value: m.memberId,
    label: m.name
  }));

  memberDropdown.setOptions(memberOptions);

  const activeMember = state.wishlist.members.find((m) => m.memberId === state.activeMemberId) || state.wishlist.members[0];

  if (activeMember) {
    state.activeMemberId = activeMember.memberId;
    memberDropdown.setValue(activeMember.memberId, activeMember.name);
  }

  const friendUrl = `${window.location.origin}/?wishlist=${state.wishlist.id}`;
  friendLinkInput.value = friendUrl;
}

function renderFriend() {
  ownerTools.classList.add("hidden");
  friendNote.classList.remove("hidden");
}

function render() {
  if (state.mode === "create") {
    setupScreen.classList.remove("hidden");
    wishlistScreen.classList.add("hidden");
    return;
  }

  if (!state.wishlist) return;

  setupScreen.classList.add("hidden");
  wishlistScreen.classList.remove("hidden");

  listHeader.textContent = state.wishlist.title;
  occasionChip.textContent = state.wishlist.occasionLabel;
  listDescription.textContent =
    state.mode === "owner"
      ? "Добавляй подарки, удаляй лишнее и делись ссылкой."
      : "Выбери участника и забронируй подарок.";

  if (!state.activeMemberId && state.wishlist.members.length) {
    state.activeMemberId = state.wishlist.members[0].memberId;
  }

  renderMemberTabs();
  renderItems();

  if (state.mode === "owner") {
    renderOwner();
  } else {
    renderFriend();
  }
}

async function loadWishlist() {
  try {
    state.wishlist = await getWishlist(wishlistId);

    if (!state.activeMemberId && state.wishlist.members.length) {
      state.activeMemberId = state.wishlist.members[0].memberId;
    }

    render();
  } catch (error) {
    alert(error.message);
  }
}

addMemberBtn.addEventListener("click", () => {
  const name = memberNameInput.value.trim();
  if (!name) return;

  if (draftMembers.some((m) => m.toLowerCase() === name.toLowerCase())) {
    alert("Такой участник уже есть");
    return;
  }

  draftMembers.push(name);
  memberNameInput.value = "";
  renderDraftMembers();
});

memberNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addMemberBtn.click();
  }
});

createWishlistBtn.addEventListener("click", async () => {
  const title = setupTitle.value.trim();
  const occasionKey = occasionDropdown.getValue();
  const selectedOption = occasionOptions.find((x) => x.value === occasionKey);
  const customOccasion = customOccasionInput.value.trim();

  const occasionLabel =
    occasionKey === "other"
      ? customOccasion
      : selectedOption?.label?.replace(/^[^\s]+\s/, "") || "";

  if (!title) {
    alert("Укажи название списка");
    return;
  }

  if (!occasionKey) {
    alert("Выбери праздник");
    return;
  }

  if (occasionKey === "other" && !customOccasion) {
    alert("Укажи название праздника");
    return;
  }

  if (draftMembers.length === 0) {
    alert("Добавь хотя бы одного участника");
    return;
  }

  try {
    const data = await createWishlist({
      title,
      occasionKey,
      occasionLabel,
      members: draftMembers
    });

    window.location.href = `/?wishlist=${data.wishlistId}&owner=${data.ownerToken}`;
  } catch (error) {
    alert(error.message);
  }
});

addGiftBtn.addEventListener("click", async () => {
  const titleInput = document.getElementById("itemTitleInput");
  const urlInput = document.getElementById("itemUrlInput");
  const imgInput = document.getElementById("itemImgInput");

  const title = titleInput ? titleInput.value.trim() : "";
  const url = urlInput ? urlInput.value.trim() : "";
  const img = imgInput ? imgInput.value.trim() : "";

  if (!title) {
    alert("Укажи название подарка");
    return;
  }

  if (!state.activeMemberId) {
    alert("Сначала выбери участника");
    return;
  }

  try {
    await addItem(state.wishlist.id, ownerToken, {
      memberId: state.activeMemberId,
      title,
      url,
      img
    });

    titleInput.value = "";
    urlInput.value = "";
    imgInput.value = "";

    await loadWishlist();
  } catch (error) {
    alert(error.message);
  }
});

copyLinkBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(friendLinkInput.value);
    copyLinkBtn.textContent = "Скопировано";
    setTimeout(() => {
      copyLinkBtn.textContent = "Копировать";
    }, 1200);
  } catch {
    alert("Не удалось скопировать ссылку");
  }
});

themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
});

applyTheme();
renderDraftMembers();

if (wishlistId) {
  loadWishlist();
}