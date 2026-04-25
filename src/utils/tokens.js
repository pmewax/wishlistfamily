import crypto from "crypto";

export function generateToken(size = 24) {
  return crypto.randomBytes(size).toString("hex");
}