"use client";

import { useState } from "react";
import Image from "next/image";
import { Thumb } from "./Thumb";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const active = images[Math.min(index, images.length - 1)];

  return (
    <div>
      <div className="flex aspect-square w-full items-center justify-center border border-line bg-surface p-4">
        {active ? (
          <Image
            src={active}
            alt={title}
            width={420}
            height={420}
            className="max-h-full w-auto object-contain"
            unoptimized
          />
        ) : (
          <Thumb title={title} size={120} />
        )}
      </div>

      {images.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((image, position) => (
            <button
              key={image}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Image ${position + 1} of ${images.length}`}
              aria-current={position === index}
              className={`border p-1 ${
                position === index ? "border-accent" : "border-line hover:border-line-strong"
              }`}
            >
              <Image
                src={image}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
