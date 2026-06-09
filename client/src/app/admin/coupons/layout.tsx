import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Coupons | Elevate Admin",
  description: "Create and manage discount codes, view coupon usage, and set validity periods for your e-learning courses.",
};

export default function CouponsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
