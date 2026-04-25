import { state, draftMembers, ownerToken } from "./state.js";
import { dom } from "./dom.js";
import { fallbackImage } from "./utils.js";
import { deleteItem, setReservation } from "./api.js";
import { loadWishlist } from "./wishlist.js";
import { memberDropdown } from "./main.js";

export function applyTheme() {
  document.body.classList.toggle("light", state.theme === "light");
  dom.themeToggle.textContent = state.theme === "light" ? "☀️" : "🌙";
  localStorage.setItem("wishlist_theme", state.theme);
}

export function renderDraftMembers() {
  dom.membersList.innerHTML = "";

  draftMembers.forEach((member, index) => {
    const el = document.createElement("div");
    el.className = "member-pill";
    el.innerHTML = `
      <span>${member}</span>
      <button type="button" data-index="${index}">×</button>
    `;
    dom.membersList.appendChild(el);
  });

  dom.membersList.querySelectorAll("button").forEach((btn) => {
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
    ${
      item.url
        ? `<div class="item-card__link"><a href="${item.url}" target="_blank" rel="noreferrer">${item.url}</a></div>`
        : ""
    }
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
  dom.memberTabs.innerHTML = "";

  state.wishlist.members.forEach((member) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `member-tab ${
      member.memberId === state.activeMemberId ? "active" : ""
    }`;
    btn.textContent = `${member.name} (${getMemberItems(member.memberId).length})`;

    btn.addEventListener("click", () => {
      state.activeMemberId = member.memberId;

      if (state.mode === "owner") {
        memberDropdown.setValue(member.memberId, member.name);
      }

      render();
    });

    dom.memberTabs.appendChild(btn);
  });
}

function renderItems() {
  dom.itemsBox.innerHTML = "";

  const activeMember = state.wishlist.members.find(
    (m) => m.memberId === state.activeMemberId
  );

  if (!activeMember) {
    dom.emptyState.classList.remove("hidden");
    return;
  }

  const items = getMemberItems(activeMember.memberId);

  if (items.length === 0) {
    dom.emptyState.classList.remove("hidden");
    dom.emptyState.querySelector(".empty-state__title").textContent = "Пока пусто";
    dom.emptyState.querySelector(".empty-state__text").textContent =
      state.mode === "owner"
        ? "Добавь первый подарок для выбранного участника."
        : "У этого участника пока нет подарков.";
    return;
  }

  dom.emptyState.classList.add("hidden");

  items.forEach((item) => {
    dom.itemsBox.appendChild(createCard(item, activeMember.name));
  });
}

function renderOwner() {
  dom.ownerTools.classList.remove("hidden");
  dom.friendNote.classList.add("hidden");

  dom.listTitleView.value = state.wishlist.title;
  dom.occasionView.value = state.wishlist.occasionLabel;

  const memberOptions = state.wishlist.members.map((m) => ({
    value: m.memberId,
    label: m.name
  }));

  memberDropdown.setOptions(memberOptions);

  const activeMember =
    state.wishlist.members.find((m) => m.memberId === state.activeMemberId) ||
    state.wishlist.members[0];

  if (activeMember) {
    state.activeMemberId = activeMember.memberId;
    memberDropdown.setValue(activeMember.memberId, activeMember.name);
  }

  dom.friendLinkInput.value = `${window.location.origin}/?wishlist=${state.wishlist.id}`;
}

function renderFriend() {
  dom.ownerTools.classList.add("hidden");
  dom.friendNote.classList.remove("hidden");
}

export function render() {
  if (state.mode === "create") {
    dom.setupScreen.classList.remove("hidden");
    dom.wishlistScreen.classList.add("hidden");
    return;
  }

  if (!state.wishlist) return;

  dom.setupScreen.classList.add("hidden");
  dom.wishlistScreen.classList.remove("hidden");

  dom.listHeader.textContent = state.wishlist.title;
  dom.occasionChip.textContent = state.wishlist.occasionLabel;

  dom.listDescription.textContent =
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