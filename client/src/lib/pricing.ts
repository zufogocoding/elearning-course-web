export interface CoursePricingInput {
  price?: string | number | null;
  discountPrice?: string | number | null;
}

export interface PricingResult {
  rawOriginalPrice: number;
  originalPrice: number;
  basePrice: number;
  couponDiscount: number;
  finalPrice: number;
  totalDiscount: number;
  discount: number;
}

/**
 * Formats a number as VND currency (e.g., 499.000 ₫).
 */
export function formatVND(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₫";
  return num.toLocaleString("vi-VN") + " ₫";
}

/**
 * Calculates all course price dimensions (original price, base price, discount, coupon deductions, final total).
 * Ensures correct numeric conversion from database string fields (Prisma decimals).
 */
export function calculateCoursePricing(
  courseDetail: CoursePricingInput | null | undefined,
  discountType: string | null | undefined,
  discountValue: number,
  couponApplied: boolean = false,
  defaultPrice: number = 0
): PricingResult {
  const rawOriginalPrice =
    courseDetail?.price !== undefined && courseDetail?.price !== null
      ? Number(courseDetail.price)
      : defaultPrice;

  const basePrice =
    courseDetail?.discountPrice !== undefined && courseDetail?.discountPrice !== null
      ? Number(courseDetail.discountPrice)
      : rawOriginalPrice;

  const originalPrice = courseDetail?.discountPrice
    ? rawOriginalPrice
    : Math.round(rawOriginalPrice * 1.5);

  let couponDiscount = 0;
  if (couponApplied && discountType) {
    const typeLower = discountType.toLowerCase();
    if (typeLower === "percent") {
      couponDiscount = Math.round((basePrice * discountValue) / 100);
    } else if (typeLower === "fixed") {
      couponDiscount = discountValue;
    }
  }

  const finalPrice = Math.round(Math.max(0, basePrice - couponDiscount));
  const totalDiscount = Math.round(Math.max(0, originalPrice - finalPrice));
  const discount = Math.round(Math.max(0, originalPrice - basePrice));

  return {
    rawOriginalPrice,
    originalPrice,
    basePrice,
    couponDiscount,
    finalPrice,
    totalDiscount,
    discount,
  };
}
