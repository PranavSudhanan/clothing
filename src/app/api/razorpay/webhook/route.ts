import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Optional safety net: marks an order paid even if the customer closes the browser before
 * returning from Razorpay. Point a Razorpay webhook (event: payment.captured) at
 * /api/razorpay/webhook and set RAZORPAY_WEBHOOK_SECRET to the same secret.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(body, signature)) return new Response("Invalid signature", { status: 400 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  if (event.event !== "payment.captured" || !payment?.order_id || !payment.id) return Response.json({ ok: true });

  const db = await getDb();
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.gatewayOrderId, payment.order_id), eq(schema.orders.paymentStatus, "unpaid")))
    .limit(1);

  if (order) {
    await db
      .update(schema.orders)
      .set({
        paymentStatus: "paid",
        gatewayPaymentId: payment.id,
        status: order.status === "pending" ? "confirmed" : order.status,
        timeline: [...order.timeline, { at: new Date().toISOString(), status: "confirmed", note: "Payment received" }],
      })
      .where(eq(schema.orders.id, order.id));
  }
  return Response.json({ ok: true });
}
