const API_BASE = "/api/wishlists";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Ошибка запроса");
  }

  return data;
}

export function createWishlist(payload) {
  return request(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getWishlist(id) {
  return request(`${API_BASE}/${id}`);
}

export function addItem(wishlistId, ownerToken, payload) {
  return request(`${API_BASE}/${wishlistId}/items`, {
    method: "POST",
    headers: {
      "x-owner-token": ownerToken
    },
    body: JSON.stringify(payload)
  });
}

export function deleteItem(wishlistId, itemId, ownerToken) {
  return request(`${API_BASE}/${wishlistId}/items/${itemId}`, {
    method: "DELETE",
    headers: {
      "x-owner-token": ownerToken
    }
  });
}

export function addGiver(wishlistId, name) {
  return request(`${API_BASE}/${wishlistId}/givers`, {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function setReservation(wishlistId, itemId, reserved, giverId) {
  return request(`${API_BASE}/${wishlistId}/items/${itemId}/reservation`, {
    method: "PATCH",
    body: JSON.stringify({
      reserved,
      giverId
    })
  });
}

export function parseWbProduct(value) {
  return request(`${API_BASE}/parse/wb`, {
    method: "POST",
    body: JSON.stringify({ value })
  });
}