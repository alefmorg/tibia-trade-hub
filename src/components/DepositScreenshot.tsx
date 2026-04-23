import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

// Extracts storage path from either a stored path or a legacy public URL.
const extractPath = (value: string): string => {
  if (!value) return value;
  const marker = "/deposit-screenshots/";
  const idx = value.indexOf(marker);
  if (idx >= 0) return value.slice(idx + marker.length);
  return value;
};

const cache = new Map<string, { url: string; expires: number }>();

const getSignedUrl = async (rawValue: string): Promise<string> => {
  const path = extractPath(rawValue);
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now() + 10_000) return cached.url;

  const { data, error } = await supabase.storage
    .from("deposit-screenshots")
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("Falha ao gerar URL");
  cache.set(path, { url: data.signedUrl, expires: Date.now() + 300_000 });
  return data.signedUrl;
};

interface DepositScreenshotProps {
  value: string;
  alt?: string;
  className?: string;
  asLink?: boolean;
  linkClassName?: string;
}

export const DepositScreenshot = ({
  value,
  alt = "Comprovante",
  className,
  asLink = false,
  linkClassName,
}: DepositScreenshotProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    if (!value) return;
    getSignedUrl(value)
      .then((u) => { if (active) setUrl(u); })
      .catch(() => { if (active) setUrl(""); });
    return () => { active = false; };
  }, [value]);

  const img = <img src={url || undefined} alt={alt} className={className} />;
  if (!asLink) return img;

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClassName}
      onClick={(e) => { if (!url) e.preventDefault(); }}
    >
      {img}
    </a>
  );
};
