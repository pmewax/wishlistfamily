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

export function getGiverStorageKey(wishlistId) {
  return `wishlist_giver_token_${wishlistId}`;
}

export function saveGiverToken(
  wishlistId,
  giverId,
  token
) {
  const data = {
    giverId,
    token
  };

  localStorage.setItem(
    getGiverStorageKey(wishlistId),
    JSON.stringify(data)
  );
}

export function loadGiverToken(
  wishlistId,
  giverId
) {
  try {
    const raw = localStorage.getItem(
      getGiverStorageKey(wishlistId)
    );

    if (!raw) {
      return "";
    }

    const data = JSON.parse(raw);

    if (data.giverId !== giverId) {
      return "";
    }

    return data.token || "";
  } catch {
    return "";
  }
}

export function clearGiverToken(wishlistId) {
  localStorage.removeItem(
    getGiverStorageKey(wishlistId)
  );
}