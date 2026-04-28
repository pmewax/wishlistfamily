import { Router } from "express";
import {
  createWishlist,
  getWishlist,
  addItem,
  deleteItem,
  addGiver,
  toggleReservation,
  parseWbProduct
} from "../controllers/wishlistController.js";

const router = Router();

router.post("/", createWishlist);

router.post("/parse/wb", parseWbProduct);

router.get("/:id", getWishlist);

router.post("/:id/items", addItem);
router.delete("/:id/items/:itemId", deleteItem);

router.post("/:id/givers", addGiver);

router.patch("/:id/items/:itemId/reservation", toggleReservation);

export default router;