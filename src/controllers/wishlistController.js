import crypto from "crypto";
import Wishlist from "../models/Wishlist.js";
import { generateToken } from "../utils/tokens.js";

const MAX_GIVERS = 5;

function makeId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function hashValue(value, salt = "") {
  return crypto
    .createHash("sha256")
    .update(`${salt}:${value}`)
    .digest("hex");
}

function isValidPin(pin) {
  return /^\d{4}$/.test(String(pin || ""));
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

function publicWishlist(wishlist) {
  return {
    id: wishlist._id,
    title: wishlist.title,
    occasionKey: wishlist.occasionKey,
    occasionLabel: wishlist.occasionLabel,
    members: wishlist.members || [],
    givers: (wishlist.givers || []).map((giver) => ({
      giverId: giver.giverId,
      name: giver.name
    })),
    items: wishlist.items || []
  };
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
      givers: [],
      items: []
    });

    return res.status(201).json({
      wishlistId: wishlist._id,
      ownerToken,
      ownerUrl: `/?wishlist=${wishlist._id}&owner=${ownerToken}`,
      friendUrl: `/?wishlist=${wishlist._id}`,
      wishlist: publicWishlist(wishlist)
    });
  } catch {
    return res.status(500).json({ message: "Ошибка создания списка" });
  }
}

export async function getWishlist(req, res) {
  try {
    const wishlist = await Wishlist.findById(req.params.id).lean();

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    return res.json(publicWishlist(wishlist));
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
      reservedBy: "",
      reservedByName: "",
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

export async function addGiver(req, res) {
  try {
    const { id } = req.params;
    const name = String(req.body.name || "").trim();
    const pin = String(req.body.pin || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Имя обязательно" });
    }

    if (!isValidPin(pin)) {
      return res.status(400).json({ message: "PIN должен состоять из 4 цифр" });
    }

    const wishlist = await Wishlist.findById(id);

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    const existing = wishlist.givers.find(
      (giver) => giver.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return res.status(400).json({
        message: "Такой даритель уже существует. Выбери его из списка и введи PIN."
      });
    }

    if (wishlist.givers.length >= MAX_GIVERS) {
      return res.status(400).json({
        message: `Можно добавить максимум ${MAX_GIVERS} дарителей`
      });
    }

    const pinSalt = generateToken(8);
    const giverToken = generateToken(24);

    const giver = {
      giverId: makeId("giver"),
      name,
      pinSalt,
      pinHash: hashValue(pin, pinSalt),
      tokenHash: hashValue(giverToken)
    };

    wishlist.givers.push(giver);

    await wishlist.save();

    return res.status(201).json({
      message: "Даритель добавлен",
      giver: {
        giverId: giver.giverId,
        name: giver.name
      },
      giverToken,
      givers: publicWishlist(wishlist).givers
    });
  } catch {
    return res.status(500).json({ message: "Ошибка добавления дарителя" });
  }
}

export async function loginGiver(req, res) {
  try {
    const { id } = req.params;
    const giverId = String(req.body.giverId || "").trim();
    const pin = String(req.body.pin || "").trim();

    if (!giverId) {
      return res.status(400).json({ message: "Даритель не выбран" });
    }

    if (!isValidPin(pin)) {
      return res.status(400).json({ message: "PIN должен состоять из 4 цифр" });
    }

    const wishlist = await Wishlist.findById(id);

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    const giver = wishlist.givers.find((g) => g.giverId === giverId);

    if (!giver) {
      return res.status(404).json({ message: "Даритель не найден" });
    }

    const pinHash = hashValue(pin, giver.pinSalt);

    if (pinHash !== giver.pinHash) {
      return res.status(403).json({ message: "Неверный PIN" });
    }

    const giverToken = generateToken(24);
    giver.tokenHash = hashValue(giverToken);

    await wishlist.save();

    return res.json({
      message: "PIN подтверждён",
      giver: {
        giverId: giver.giverId,
        name: giver.name
      },
      giverToken
    });
  } catch {
    return res.status(500).json({ message: "Ошибка входа дарителя" });
  }
}

export async function toggleReservation(req, res) {
  try {
    const { id, itemId } = req.params;
    const { reserved, giverId, giverToken } = req.body;

    const wishlist = await Wishlist.findById(id);

    if (!wishlist) {
      return res.status(404).json({ message: "Список не найден" });
    }

    const item = wishlist.items.find((x) => x.itemId === itemId);

    if (!item) {
      return res.status(404).json({ message: "Подарок не найден" });
    }

    const giver = wishlist.givers.find((g) => g.giverId === String(giverId || ""));

    if (!giver) {
      return res.status(400).json({ message: "Сначала выбери, кто дарит" });
    }

    if (!giverToken || hashValue(giverToken) !== giver.tokenHash) {
      return res.status(403).json({
        message: "Нужно подтвердить PIN дарителя"
      });
    }

    const needReserve = Boolean(reserved);

    if (needReserve) {
      if (item.reserved && item.reservedBy !== giver.giverId) {
        return res.status(403).json({
          message: "Этот подарок уже забронировал другой человек"
        });
      }

      item.reserved = true;
      item.reservedBy = giver.giverId;
      item.reservedByName = giver.name;
      item.reservedAt = new Date();
    } else {
      if (!item.reserved) {
        return res.json({
          message: "Подарок уже свободен",
          item
        });
      }

      if (item.reservedBy !== giver.giverId) {
        return res.status(403).json({
          message: "Снять бронь может только тот, кто её поставил"
        });
      }

      item.reserved = false;
      item.reservedBy = "";
      item.reservedByName = "";
      item.reservedAt = null;
    }

    await wishlist.save();

    return res.json({
      message: item.reserved ? "Подарок забронирован" : "Бронь снята",
      item
    });
  } catch {
    return res.status(500).json({ message: "Ошибка бронирования" });
  }
}

function extractWbArticle(value) {
  const text = String(value || "").trim();

  const fromUrl = text.match(/catalog\/(\d+)\/detail/i);
  if (fromUrl) return fromUrl[1];

  const digits = text.match(/\d{6,}/);
  if (digits) return digits[0];

  return "";
}

function buildWbPaths(article, basketNumber) {
  const nm = Number(article);
  const vol = Math.floor(nm / 100000);
  const part = Math.floor(nm / 1000);
  const basket = String(basketNumber).padStart(2, "0");

  const baseUrl = `https://basket-${basket}.wbcontent.net/vol${vol}/part${part}/${article}`;

  return {
    cardUrl: `${baseUrl}/info/ru/card.json`,
    imageUrl: `${baseUrl}/images/big/1.webp`,
    images: [
      `${baseUrl}/images/big/1.webp`,
      `${baseUrl}/images/c516x688/1.webp`,
      `${baseUrl}/images/c246x328/1.webp`,
      `${baseUrl}/images/tm/1.webp`
    ]
  };
}

function normalizeWbTitle(data) {
  const parts = [];

  if (data?.imt_name) parts.push(data.imt_name);
  if (!data?.imt_name && data?.subj_name) parts.push(data.subj_name);
  if (data?.name && data.name !== data?.imt_name) parts.push(data.name);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

async function tryFetchWbCard(article) {
  for (let basket = 1; basket <= 40; basket++) {
    const paths = buildWbPaths(article, basket);

    try {
      const response = await fetch(paths.cardUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      });

      if (!response.ok) continue;

      const data = await response.json();

      return {
        data,
        cardUrl: paths.cardUrl,
        imageUrl: paths.imageUrl,
        images: paths.images
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function parseWbProduct(req, res) {
  try {
    const article = extractWbArticle(req.body.value);

    if (!article) {
      return res.status(400).json({
        message: "Вставь ссылку Wildberries или артикул"
      });
    }

    const result = await tryFetchWbCard(article);

    if (!result) {
      return res.status(404).json({
        message: "Товар WB не найден"
      });
    }

    const title = normalizeWbTitle(result.data);

    return res.json({
      article,
      title: title || `Товар Wildberries ${article}`,
      url: `https://www.wildberries.ru/catalog/${article}/detail.aspx`,
      img: result.imageUrl,
      images: result.images,
      cardUrl: result.cardUrl
    });
  } catch {
    return res.status(500).json({
      message: "Ошибка парсинга WB"
    });
  }
}