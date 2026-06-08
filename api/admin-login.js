import crypto from "crypto";

function constantTimeEqual(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({
      success: false,
      message: "Admin password is not configured.",
    });
  }

  const submittedPassword = req.body?.password;

  if (!submittedPassword || typeof submittedPassword !== "string") {
    return res.status(400).json({
      success: false,
      message: "Password is required.",
    });
  }

  const isCorrect = constantTimeEqual(submittedPassword, adminPassword);

  if (!isCorrect) {
    return res.status(401).json({
      success: false,
      message: "Wrong password.",
    });
  }

  return res.status(200).json({
    success: true,
  });
}