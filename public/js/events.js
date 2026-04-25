import { createWishlist, addItem } from "./api.js";
import { occasionOptions } from "./constants.js";
import { dom } from "./dom.js";
import { state, draftMembers, ownerToken } from "./state.js";
import { renderDraftMembers, applyTheme } from "./render.js";
import { loadWishlist } from "./wishlist.js";
import { occasionDropdown } from "./main.js";

export function initEvents() {
  dom.addMemberBtn.addEventListener("click", () => {
    const name = dom.memberNameInput.value.trim();
    if (!name) return;

    if (draftMembers.some((m) => m.toLowerCase() === name.toLowerCase())) {
      alert("Такой участник уже есть");
      return;
    }

    draftMembers.push(name);
    dom.memberNameInput.value = "";
    renderDraftMembers();
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

  dom.addGiftBtn.addEventListener("click", async () => {
    const title = dom.itemTitleInput.value.trim();
    const url = dom.itemUrlInput.value.trim();
    const img = dom.itemImgInput.value.trim();

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

      dom.itemTitleInput.value = "";
      dom.itemUrlInput.value = "";
      dom.itemImgInput.value = "";

      await loadWishlist();
    } catch (error) {
      alert(error.message);
    }
  });

  dom.copyLinkBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(dom.friendLinkInput.value);

      dom.copyLinkBtn.textContent = "Скопировано";

      setTimeout(() => {
        dom.copyLinkBtn.textContent = "Копировать";
      }, 1200);
    } catch {
      alert("Не удалось скопировать ссылку");
    }
  });

  dom.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });
}