"use client";

import dynamicImport from "next/dynamic";
import type { MapMarker, MapPoint } from "@/components/map/MapView";

/**
 * Leaflet depende de `window`, então o mapa só pode ser carregado no cliente.
 * Next 15 proíbe `ssr:false` em Server Component — este wrapper é o Client
 * Component que concentra essa decisão, mantendo a página em Server Component.
 */
const MapView = dynamicImport(() => import("@/components/map/MapView").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[520px] items-center justify-center rounded-xl border border-neutro-300 bg-neutro-100 text-sm text-neutro-500"
      role="status"
      aria-live="polite"
    >
      Carregando mapa…
    </div>
  ),
});

export default function MapLoader(props: {
  points?: MapPoint[];
  markers?: MapMarker[];
  showHeatmap?: boolean;
  height?: number;
}) {
  return <MapView {...props} />;
}