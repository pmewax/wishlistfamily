import { FancyDropdown } from "./dropdown.js";
import { occasionOptions } from "./constants.js";
import { dom } from "./dom.js";
import { state, wishlistId } from "./state.js";
import { applyTheme, render, renderDraftMembers } from "./render.js";
import { loadWishlist } from "./wishlist.js";
import { initEvents } from "./events.js";

export const occasionDropdown = new FancyDropdown({
  mount: dom.occasionDropdown,
  placeholder: "Выбери праздник",
  options: occasionOptions,
  onChange: (value) => {
    dom.customOccasionField.classList.toggle("hidden", value !== "other");
  }
});

export const memberDropdown = new FancyDropdown({
  mount: dom.memberDropdown,
  placeholder: "Выбери участника",
  options: [],
  onChange: (value) => {
    state.activeMemberId = value;
    render();
  }
});

applyTheme();
renderDraftMembers();
initEvents();

if (wishlistId) {
  loadWishlist();
} else {
  render();
}