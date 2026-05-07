import {
  createWishlist,
  addItem,
  addGiver,
  loginGiver,
  parseWbProduct
} from "./api.js";
import { occasionOptions } from "./constants.js";
import { dom } from "./dom.js";
import {
  state,
  draftMembers,
  ownerToken,
  wishlistId,
  saveGiverToken,
  loadGiverToken
} from "./state.js";
import { render, renderDraftMembers, applyTheme } from "./render.js";
import { loadWishlist } from "./wishlist.js";
import { occasionDropdown } from "./main.js";
import { showToast, openPinModal } from "./ui.js";

function isPinValid(pin) {
  return /^\d{4}$/.test(String(pin || ""));
}

export function initEvents() {
  dom.addMemberBtn.addEventListener("click", () => {
    const name = dom.memberNameInput.value.trim();

    if (!name) {
      showToast("Введи имя участника", "warning");
      return;
    }

    if (draftMembers.some((m) => m.toLowerCase() === name.toLowerCase())) {
      showToast("Такой участник уже есть", "warning");
      return;
    }

    draftMembers.push(name);
    dom.memberNameInput.value = "";
    renderDraftMembers();
    showToast("Участник добавлен", "success");
  });

  dom.memberNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dom.addMemberBtn.click();
    }
  });

  dom.createWishlistBtn.addEventListener("click", async () => {
    const title = dom.setupTitle.value.trim();
    const occasionKey = occasionDropdown.getValue();
    const selectedOption = occasionOptions.find((x) => x.value === occasionKey);
    const customOccasion = dom.customOccasionInput.value.trim();

    const occasionLabel =
      occasionKey === "other"
        ? customOccasion
        : selectedOption?.label?.replace(/^[^\s]+\s/, "") || "";

    if (!title) {
      showToast("Укажи название списка", "warning");
      return;
    }

    if (!occasionKey) {
      showToast("Выбери праздник", "warning");
      return;
    }

    if (occasionKey === "other" && !customOccasion) {
      showToast("Укажи название праздника", "warning");
      return;
    }

    if (draftMembers.length === 0) {
      showToast("Добавь хотя бы одного участника", "warning");
      return;
    }

    try {
      const data = await createWishlist({
        title,
        occasionKey,
        occasionLabel,
        members: draftMembers
      });

      showToast("Wishlist создан", "success");
      window.location.href = `/?wishlist=${data.wishlistId}&owner=${data.ownerToken}`;
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  dom.parseWbBtn?.addEventListener("click", async () => {
    const value = dom.itemUrlInput.value.trim() || dom.itemTitleInput.value.trim();

    if (!value) {
      showToast("Вставь ссылку WB или артикул", "warning");
      return;
    }

    try {
      dom.parseWbBtn.disabled = true;
      dom.parseWbBtn.textContent = "Ищу...";

      const product = await parseWbProduct(value);

      dom.itemTitleInput.value = product.title || "";
      dom.itemUrlInput.value = product.url || "";
      dom.itemImgInput.value = product.img || "";

      showToast("Данные WB получены", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      dom.parseWbBtn.disabled = false;
      dom.parseWbBtn.textContent = "Заполнить с WB";
    }
  });

  dom.addGiftBtn.addEventListener("click", async () => {
    const title = dom.itemTitleInput.value.trim();
    const url = dom.itemUrlInput.value.trim();
    const img = dom.itemImgInput.value.trim();

    if (!title) {
      showToast("Укажи название подарка", "warning");
      return;
    }

    if (!state.activeMemberId) {
      showToast("Сначала выбери участника", "warning");
      return;
    }

    try {
      await addItem(state.wishlist.id, ownerToken, {
        memberId: state.activeMemberId,
        title,
        url,
        img
      });

      dom.itemTitleInput.value = "";
      dom.itemUrlInput.value = "";
      dom.itemImgInput.value = "";

      await loadWishlist();
      showToast("Подарок добавлен", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  dom.addGiverBtn?.addEventListener("click", async () => {
    const name = dom.giverNameInput.value.trim();
    const pin = dom.giverPinInput.value.trim();

    if (!name) {
      showToast("Введи имя дарителя", "warning");
      return;
    }

    if (!isPinValid(pin)) {
      showToast("PIN должен состоять из 4 цифр", "warning");
      return;
    }

    try {
      const data = await addGiver(state.wishlist.id, name, pin);

      state.activeGiverId = data.giver.giverId;
      state.activeGiverToken = data.giverToken;

      saveGiverToken(state.wishlist.id, data.giver.giverId, data.giverToken);

      dom.giverNameInput.value = "";
      dom.giverPinInput.value = "";

      await loadWishlist();
      showToast("Даритель добавлен и выбран", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  dom.giverNameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dom.giverPinInput.focus();
    }
  });

  dom.giverPinInput?.addEventListener("input", () => {
    dom.giverPinInput.value = dom.giverPinInput.value.replace(/\D/g, "").slice(0, 4);
  });

  dom.giverPinInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dom.addGiverBtn.click();
    }
  });

  dom.copyLinkBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(dom.friendLinkInput.value);

      showToast("Ссылка скопирована", "success");

      dom.copyLinkBtn.textContent = "Скопировано";

      setTimeout(() => {
        dom.copyLinkBtn.textContent = "Копировать";
      }, 1200);
    } catch {
      showToast("Не удалось скопировать ссылку", "error");
    }
  });

  dom.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });
}

export async function selectGiver(giverId) {
  const giver = state.wishlist?.givers?.find(
    (g) => g.giverId === giverId
  );

  if (!giver) {
    showToast("Даритель не найден", "error");
    return;
  }

  state.activeGiverId = "";
  state.activeGiverToken = "";

  const savedToken = loadGiverToken(wishlistId, giverId);

  if (savedToken) {
    state.activeGiverId = giverId;
    state.activeGiverToken = savedToken;

    render();

    showToast(
      `Выбран даритель: ${giver.name}`,
      "success"
    );

    return;
  }

  const pin = await openPinModal(giver.name);

  if (!pin) {
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    showToast(
      "PIN должен состоять из 4 цифр",
      "warning"
    );
    return;
  }

  try {
    const data = await loginGiver(
      wishlistId,
      giverId,
      pin
    );

    state.activeGiverId = data.giver.giverId;
    state.activeGiverToken = data.giverToken;

    saveGiverToken(
      wishlistId,
      data.giver.giverId,
      data.giverToken
    );

    render();

    showToast("PIN подтверждён", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}