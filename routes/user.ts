import express from "express";
import user from "../controller/user";
import { setCollection } from "../middleware/collection";
import { validateToken } from "../middleware/auth";

const router = express.Router();

router.post("/", setCollection("user"), user.create);

router.put("/:id", validateToken([""]), setCollection("user"), user.update);

router.delete("/:id", validateToken([""]), setCollection("user"), user.delete);

router.get("/:id", validateToken([""]), setCollection("user"), user.getOne);

router.get("/", validateToken([""]), setCollection("user"), user.getAll);

export default router;
