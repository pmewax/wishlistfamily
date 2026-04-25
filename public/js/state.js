const qs = new URLSearchParams(window.location.search);

export const wishlistId = qs.get("wishlist");
export const ownerToken = qs.get("owner");

export const state = {
  theme: localStorage.getItem("wishlist_theme") || "dark",
  mode: wishlistId ? (ownerToken ? "owner" : "friend") : "create",
  wishlist: null,
  activeMemberId: ""
};

export const draftMembers = [];