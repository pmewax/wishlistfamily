import crypto from "crypto";
import Wishlist from "../models/Wishlist.js";
import { generateToken } from "../utils/tokens.js";

function makeId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function isHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeMembers(members) {
  if (!Array.isArray(members)) return [];

  const seen = new Set();
  const result = [];

  for (const rawName of members) {
    const name = String(rawName || "").trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push({
      memberId: makeId("mem"),
      name
    });
  }

  return result;
}

function getOwnerToken(req) {
  return req.headers["x-owner-token"] || req.body.ownerToken || req.query.ownerToken || "";
}

export async function createWishlist(req, res) {
  try {
    const { title, occasionKey, occasionLabel, members } = req.body;

    const cleanTitle = String(title || "").trim();
    const cleanOccasionKey = String(occasionKey || "").trim();
    const cleanOccasionLabel = String(occasionLabel || "").trim();
    const cleanMembers = normalizeMembers(members);

    if (!cleanTitle) {
      return res.status(400).json({ message: "Название списка обязательно" });
    }

    if (!cleanOccasionKey || !cleanOccasionLabel) {
      return res.status(400).json({ message: "Праздник обязателен" });
    }

    if (cleanMembers.length === 0) {
      return res.status(400).json({ message: "Добавь хотя бы одного участника" });
    }

    const ownerToken = generateToken(20);

    const wishlist = await Wishlist.create({
      title: cleanTitle,
      occasionKey: cleanOccasionKey,
      occasionLabel: cleanOccasionLabel,
      ownerToken,
      members: cleanMembers,
      items: []
    });

    return res.status(201).json({
      wishlistId: wishlist._id,
      ownerToken,
      ownerUrl: `/ ?wishlist=${wishlist._id}&owner=${ownerToken}`.replace(" ", ""),
      friendUrl: `/ ?wishlist=${wishlist._id}`.replace(" ", ""),
      wishlist: {
        id: wishlist._id,
        title: wishlist.title,
        occasionKey: wishlist.occasionKey,
        occasionLabel: wishlist.occasionLabel,
        members: wishlist.members,
        items: wishlist.items
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка создания списка" });
  }
}

export async function getWishlist(req, res) {
  try {
    const wishlist = await Wishlist.findById(req.params.id).lean();

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    return res.json({
      id: wishlist._id,
      title: wishlist.title,
      occasionKey: wishlist.occasionKey,
      occasionLabel: wishlist.occasionLabel,
      members: wishlist.members,
      items: wishlist.items
    });
  } catch {
    return res.status(400).json({ message: "Некорректный id списка" });
  }
}

export async function addItem(req, res) {
  try {
    const ownerToken = getOwnerToken(req);
    const { memberId, title, url = "", img = "" } = req.body;

    const wishlist = await Wishlist.findById(req.params.id);

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    if (wishlist.ownerToken !== ownerToken) {
      return res.status(403).json({ message: "Нет прав на изменение списка" });
    }

    const cleanTitle = String(title || "").trim();
    const cleanMemberId = String(memberId || "").trim();
    const cleanUrl = String(url || "").trim();
    const cleanImg = String(img || "").trim();

    if (!cleanTitle) {
      return res.status(400).json({ message: "Название подарка обязательно" });
    }

    if (!cleanMemberId) {
      return res.status(400).json({ message: "Участник обязателен" });
    }

    const hasMember = wishlist.members.some((m) => m.memberId === cleanMemberId);
    if (!hasMember) {
      return res.status(400).json({ message: "Участник не найден" });
    }

    if (!isHttpUrl(cleanUrl) || !isHttpUrl(cleanImg)) {
      return res.status(400).json({ message: "Некорректная ссылка" });
    }

    wishlist.items.unshift({
      itemId: makeId("itm"),
      memberId: cleanMemberId,
      title: cleanTitle,
      url: cleanUrl,
      img: cleanImg,
      reserved: false,
      reservedAt: null
    });

    await wishlist.save();

    return res.json({
      message: "Подарок добавлен",
      items: wishlist.items
    });
  } catch {
    return res.status(500).json({ message: "Ошибка добавления подарка" });
  }
}

export async function deleteItem(req, res) {
  try {
    const ownerToken = getOwnerToken(req);
    const { id, itemId } = req.params;

    const wishlist = await Wishlist.findById(id);

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    if (wishlist.ownerToken !== ownerToken) {
      return res.status(403).json({ message: "Нет прав на удаление" });
    }

    const before = wishlist.items.length;
    wishlist.items = wishlist.items.filter((item) => item.itemId !== itemId);

    if (before === wishlist.items.length) {
      return res.status(404).json({ message: "Подарок не найден" });
    }

    await wishlist.save();

    return res.json({
      message: "Подарок удален",
      items: wishlist.items
    });
  } catch {
    return res.status(500).json({ message: "Ошибка удаления подарка" });
  }
}

export async function toggleReservation(req, res) {
  try {
    const { id, itemId } = req.params;
    const { reserved } = req.body;

    const wishlist = await Wishlist.findById(id);

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    const item = wishlist.items.find((x) => x.itemId === itemId);

    if (!item) {
      return res.status(404).json({ message: "Подарок не найден" });
    }

    item.reserved = Boolean(reserved);
    item.reservedAt = item.reserved ? new Date() : null;

    await wishlist.save();

    return res.json({
      message: item.reserved ? "Подарок забронирован" : "Бронь снята",
      item
    });
  } catch {
    return res.status(500).json({ message: "Ошибка бронирования" });
  }
}