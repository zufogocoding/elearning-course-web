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
    : parseFloat((rawOriginalPrice * 1.5).toFixed(2));

  let couponDiscount = 0;
  if (couponApplied && discountType) {
    const typeLower = discountType.toLowerCase();
    if (typeLower === "percent") {
      couponDiscount = (basePrice * discountValue) / 100;
    } else if (typeLower === "fixed") {
      couponDiscount = discountValue;
    }
  }

  const finalPrice = parseFloat(Math.max(0, basePrice - couponDiscount).toFixed(2));
  const totalDiscount = parseFloat(Math.max(0, originalPrice - finalPrice).toFixed(2));
  const discount = parseFloat(Math.max(0, originalPrice - basePrice).toFixed(2));

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
