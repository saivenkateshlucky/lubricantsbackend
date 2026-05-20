import { Router } from "express";
import { Resend } from "resend";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { EnquiryCreateSchema } from "../schemas";

const router = Router();
const resend = new Resend(config.resend.apiKey);

/**
 * POST /api/enquiries
 * Body: { name, email, phone?, message, product_id? }
 */
router.post("/", async (req, res) => {
  const { name, email, phone, message, product_id } = EnquiryCreateSchema.parse(req.body);

  const enquiry = await prisma.enquiry.create({
    data: { name, email, phone, message, product_id },
  });

  // Create an admin notification for the new enquiry
  await prisma.adminNotification.create({
    data: {
      type: "new_enquiry",
      payload: {
        enquiry_id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
      },
    },
  });

  // Send email using Resend (fire and forget or await)
  if (config.resend.apiKey) {
    resend.emails.send({
      from: config.resend.fromEmail,
      to: config.resend.toEmail,
      subject: `New Enquiry from ${name}`,
      html: `
        <h3>New Enquiry Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    }).catch(err => console.error("Resend email failed:", err));
  }

  res.status(201).json({ success: true, data: enquiry });
});

export { router as enquiriesRouter };
