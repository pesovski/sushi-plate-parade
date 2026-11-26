import { sendTemplateEmail } from "./email-templates/send-email";
import { confirmationData, confirmationKey, type ConfirmationOrder } from "./order-confirmation";

// Recipient is the authenticated order owner, never a browser-supplied address.
export async function sendOrderConfirmation(order: ConfirmationOrder, recipient: string) {
  const templateData = confirmationData(order);
  if (!templateData) return;
  return sendTemplateEmail("order-confirmation", recipient, {
    templateData,
    idempotencyKey: confirmationKey(order.id),
  });
}