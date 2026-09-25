"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProduct } from "@/hooks/useProduct";
import { useCategories } from "@/hooks/useCategories";
import { useOverrides } from "@/lib/overrides";
import { setArtificialDelay } from "@/lib/http";
import { formatCategory, formatPrice, formatRating } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { ErrorState } from "./ListStates";
import { ProductFormDialog } from "./ProductFormDialog";
import { DeleteDialog } from "./DeleteDialog";
import { ProductGallery } from "./ProductGallery";
import { ProductReviews } from "./ProductReviews";
import { StockValue } from "./ProductTable";

export function ProductDetail({ rawId }: { rawId: string }) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const backHref = `/products${search ? `?${search}` : ""}`;

  setArtificialDelay(Number(searchParams.get("delay")));

  const id = Number(rawId);
  const { status, product, error, deleted, edited, retry } = useProduct(id);
  const categories = useCategories();
  const overrides = useOverrides();

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  if (deleted || overrides.deleted.includes(id)) {
    return (
      <Shell backHref={backHref}>
        <Notice
          title="You deleted this product"
          body={`Product #${rawId} is hidden for the rest of this session. Clearing local changes on the list brings it back.`}
          backHref={backHref}
        />
      </Shell>
    );
  }

  if (status === "error" && error) {
    return (
      <Shell backHref={backHref}>
        {error.kind === "not-found" ? (
          <Notice
            title={`Product #${rawId} doesn't exist`}
            body="The catalogue has ids 1 to 194. Check the number, or go back to the list."
            backHref={backHref}
          />
        ) : (
          <div className="rounded-sm border border-line bg-surface">
            <ErrorState error={error} onRetry={retry} />
          </div>
        )}
      </Shell>
    );
  }

  if (status === "loading" || !product) {
    return (
      <Shell backHref={backHref}>
        <div aria-hidden className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="aspect-square w-full border border-line bg-sunken" />
          <div className="space-y-3 pt-1">
            <div className="h-4 w-2/3 bg-sunken" />
            <div className="h-3 w-1/3 bg-sunken" />
            <div className="h-3 w-full bg-sunken" />
            <div className="h-3 w-5/6 bg-sunken" />
          </div>
        </div>
      </Shell>
    );
  }

  const images = product.images?.length ? product.images : [product.thumbnail].filter(Boolean);

  return (
    <Shell backHref={backHref}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink">{product.title}</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            {formatCategory(product.category)}
            {product.brand ? ` · ${product.brand}` : ""}
            {product.sku ? <span className="font-mono text-ink-3"> · {product.sku}</span> : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button size="sm" onClick={() => setConfirming(true)} className="text-danger">
            Delete
          </Button>
        </div>
      </div>

      {edited ? (
        <p className="mt-3 border-l-2 border-warn bg-warn-soft py-2 pr-3 pl-2.5 text-[13px] text-ink-2">
          Showing your local edits. The API still holds the original values.
        </p>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <ProductGallery images={images} title={product.title} />

        <div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-line bg-line">
            <Stat label="Price">
              <span className="num text-base font-semibold text-ink">
                {formatPrice(product.price)}
              </span>
              {product.discountPercentage ? (
                <span className="num ml-1.5 text-[13px] text-ink-3">
                  −{product.discountPercentage}%
                </span>
              ) : null}
            </Stat>
            <Stat label="Rating">
              <span className="num text-base font-semibold text-ink">
                {formatRating(product.rating)}
              </span>
              <span className="text-[13px] text-ink-3"> / 5</span>
            </Stat>
            <Stat label="Stock">
              <span className="num text-base font-semibold">
                <StockValue stock={product.stock} />
              </span>
              {product.availabilityStatus ? (
                <span className="text-[13px] text-ink-3"> · {product.availabilityStatus}</span>
              ) : null}
            </Stat>
          </dl>

          <h2 className="mt-5 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">
            Description
          </h2>
          <p className="mt-1.5 max-w-prose text-sm text-ink-2">{product.description}</p>

          <dl className="mt-5 max-w-prose divide-y divide-line border-t border-line text-sm empty:hidden">
            <Row label="Warranty" value={product.warrantyInformation} />
            <Row label="Shipping" value={product.shippingInformation} />
            <Row label="Returns" value={product.returnPolicy} />
          </dl>
        </div>
      </div>

      <ProductReviews reviews={product.reviews ?? []} />

      {editing ? (
        <ProductFormDialog
          product={product}
          categories={categories}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setEditing(false);
            setToast({ id: Date.now(), text: `Saved “${saved.title}” locally.` });
          }}
        />
      ) : null}

      {confirming ? (
        <DeleteDialog
          product={product}
          onClose={() => setConfirming(false)}
          onDeleted={() => setConfirming(false)}
        />
      ) : null}

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </Shell>
  );
}

function Shell({ backHref, children }: { backHref: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <Link
        href={backHref}
        className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink"
      >
        ← Back to products
      </Link>
      <div className="mt-4">{children}</div>
    </main>
  );
}

function Notice({ title, body, backHref }: { title: string; body: string; backHref: string }) {
  return (
    <div className="rounded-sm border border-line bg-surface px-4 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-2">{body}</p>
      <Link href={backHref} className="mt-3 inline-block">
        <Button>Back to products</Button>
      </Link>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="text-[12px] font-medium tracking-wide text-ink-3 uppercase">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2">
      <dt className="w-24 shrink-0 text-ink-3">{label}</dt>
      <dd className="text-ink-2">{value}</dd>
    </div>
  );
}
