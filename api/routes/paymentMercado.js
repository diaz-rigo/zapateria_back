const express = require("express");
const {
  createOrder,
  receiveWebhook,
} = require("../controllers/paymentMercado.js");

const router = express.Router();

router.post("/create-order", createOrder);

router.post("/webhook", receiveWebhook);

router.get("/success", (req, res) => res.send("Success"));

module.exports = router;
