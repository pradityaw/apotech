import type { Metadata } from "next";
import { StokObatClient } from "./stok-obat-client";

export const metadata: Metadata = {
  title: "Stok Obat - ApoTech",
  description: "Daftar stok obat dengan status kepatuhan dan tanggal kedaluwarsa."
};

export default function StokObatPage() {
  return <StokObatClient />;
}
