const qs = new URLSearchParams(window.location.search);

export const wishlistId = qs.get("wishlist");
export const ownerToken = qs.get("owner");

export const state = {
  theme: localStorage.getItem("wishlist_theme") || "dark",
  mode: wishlistId ? (ownerToken ? "owner" : "friend") : "create",
  wishlist: null,
  activeMemberId: "",
  activeGiverId: "",
  activeGiverToken: ""
};

export const draftMembers = [];

export function getGiverStorageKey(wishlistId, giverId) {
  return `wishlist_giver_token_${wishlistId}_${giverId}`;
}

export function saveGiverToken(wishlistId, giverId, token) {
  localStorage.setItem(getGiverStorageKey(wishlistId, giverId), token);
}

export function loadGiverToken(wishlistId, giverId) {
  return localStorage.getItem(getGiverStorageKey(wishlistId, giverId)) || "";
}