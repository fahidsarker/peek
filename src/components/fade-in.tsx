"use client";

import { useEffect, useState } from "react";

export function FadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
