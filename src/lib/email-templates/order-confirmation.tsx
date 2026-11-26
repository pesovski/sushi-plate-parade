import { Body, Button, Column, Container, Head, Heading, Hr, Html, Img, Preview, Row, Section, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import type { TemplateEntry } from "./registry";
import logo from "@/assets/restorani-logo-wide.png.asset.json";

interface Props {
  orderId?: string;
  items?: { name: string; quantity: number; unit_price_cents: number }[];
  totalCents?: number;
  currency?: string;
}

// Email clients need inline, email-safe equivalents of the homepage's theme.
const brand = { paper: "#ffffff", ink: "#202522", muted: "#626963", red: "#b52723", green: "#eaf1e8", border: "#dedfd8" };
const body: CSSProperties = { backgroundColor: brand.paper, color: brand.ink, fontFamily: '"DM Sans", Arial, sans-serif', margin: 0 };
const container: CSSProperties = { maxWidth: 560, margin: "0 auto", padding: "32px 24px" };
const heading: CSSProperties = { fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, fontSize: 32, lineHeight: "38px", margin: "24px 0 12px" };
const money = (cents: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

export function OrderConfirmation({ orderId = "", items = [], totalCents = 0, currency = "usd" }: Props) {
  return <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your restorani.bar order is confirmed. Here’s what you ordered.</Preview>
    <Body style={body}><Container style={container}>
      <Img src={new URL(logo.url, "https://restorani.bar").href} alt="Restorani.bar" width={220} style={{ maxWidth: "100%", height: "auto", margin: "0 auto 24px" }} />
      <Section style={{ backgroundColor: brand.green, padding: "12px 20px", borderRadius: 8 }}><Text style={{ margin: 0, fontSize: 14 }}>Payment confirmed</Text></Section>
      <Heading style={heading}>Thank you for your order.</Heading>
      <Text style={{ fontSize: 16, lineHeight: "25px" }}>Fresh plates. Good company. Your payment is complete, and your order is confirmed.</Text>
      {orderId && <Text style={{ color: brand.muted, fontSize: 12, overflowWrap: "anywhere" }}>Order reference: {orderId}</Text>}
      <Hr style={{ borderColor: brand.border, margin: "24px 0" }} />
      <Heading as="h2" style={{ ...heading, fontSize: 22, lineHeight: "28px", margin: "0 0 12px" }}>Your order</Heading>
      {items.map((item, index) => <Section key={index} style={{ borderBottom: `1px solid ${brand.border}`, padding: "12px 0" }}>
        <Row><Column style={{ width: "72%", verticalAlign: "top" }}>
          <Text style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>{item.name}</Text>
          <Text style={{ margin: 0, color: brand.muted, fontSize: 13 }}>{item.quantity} × {money(item.unit_price_cents, currency)}</Text>
        </Column><Column style={{ textAlign: "right", verticalAlign: "top" }}><Text style={{ margin: 0, fontSize: 15 }}>{money(item.quantity * item.unit_price_cents, currency)}</Text></Column></Row>
      </Section>)}
      <Row style={{ marginTop: 20 }}><Column><Text style={{ fontWeight: 600, fontSize: 18 }}>Total paid</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ fontWeight: 600, fontSize: 18 }}>{money(totalCents, currency)}</Text></Column></Row>
      <Section style={{ marginTop: 20 }}><Button href="https://restorani.bar" style={{ backgroundColor: brand.red, color: brand.paper, padding: "14px 22px", borderRadius: 8, fontSize: 14 }}>View your orders</Button></Section>
      <Text style={{ marginTop: 28, fontSize: 12, color: brand.muted }}>restorani.bar · Order confirmation</Text>
    </Container></Body>
  </Html>;
}

export const template = {
  component: OrderConfirmation,
  subject: "Your restorani.bar order is confirmed",
  displayName: "Order confirmation",
  previewData: { orderId: "a35c9782-1234-4567-8901-123456789abc", currency: "usd", totalCents: 1100, items: [{ name: "Salmon nigiri", quantity: 1, unit_price_cents: 420 }, { name: "Tuna nigiri", quantity: 1, unit_price_cents: 680 }] },
} satisfies TemplateEntry;