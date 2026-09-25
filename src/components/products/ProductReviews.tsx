import type { Review } from "@/types/product";
import { formatReviewDate } from "@/lib/format";

export function ProductReviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-semibold tracking-wide text-ink-3 uppercase">
        Reviews ({reviews.length})
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">No one has reviewed this product yet.</p>
      ) : (
        <ul className="mt-2 max-w-3xl divide-y divide-line border-t border-line">
          {reviews.map((review, index) => (
            <li key={`${review.reviewerEmail}-${index}`} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-ink">{review.reviewerName}</p>
                <p className="num text-[13px] text-ink-3">
                  {review.rating}/5 · {formatReviewDate(review.date)}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-2">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
