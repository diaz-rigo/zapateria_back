const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentStripe');

// const router = Router();

router.post("/create-checkout-session", paymentController.createSession);
router.post("/create-checkout-session2", paymentController.createSession2);

router.get("/success", (req, res) => res.redirect("/success.html"));

router.get("/cancel", (req, res) => res.redirect("/cancel.html"));

module.exports = router;

