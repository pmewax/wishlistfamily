import { Router } from "express";
import {
  createWishlist,
  getWishlist,
  addItem,
  deleteItem,
  toggleReservation
} from "../controllers/wishlistController.js";

const router = Router();

router.post("/", createWishlist);
router.get("/:id", getWishlist);
router.post("/:id/items", addItem);
router.delete("/:id/items/:itemId", deleteItem);
router.patch("/:id/items/:itemId/reservation", toggleReservation);

export default router;