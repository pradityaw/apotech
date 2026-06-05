import type { Metadata } from "next";
import { InventoryClient } from "./inventory-client";

export const metadata: Metadata = {
  title: "Inventory - ApoTech",
  description: "Product catalog, stock batches, and goods receipt management."
};

export default function InventoryPage() {
  return <InventoryClient />;
}
