import { getWishlist } from "./api.js";
import { state, wishlistId } from "./state.js";
import { render } from "./render.js";

export async function loadWishlist() {
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