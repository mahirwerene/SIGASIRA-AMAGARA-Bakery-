import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // serve index.html and assets

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Route: create checkout session
app.post("/create-checkout-session", async (req, res) => {
  const { name, email, location, product } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product,
            },
            unit_amount: 5000, // price $50 (change as needed)
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5000/success.html",
      cancel_url: "http://localhost:5000/cancel.html",
      customer_email: email,
      metadata: { name, location },
    });

    // Send email notification to bakery
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "🍞 New CyberBoulangerie Order",
      text: `Order received:
- Customer: ${name}
- Product: ${product}
- Location: ${location}
- Email: ${email}`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html by default
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 CyberBoulangerie server running at http://localhost:${PORT}`));
