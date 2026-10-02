"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LAGES_CENTER } from "@/lib/geo/protection";
import { CATEGORY_LABEL } from "@/components/map/categoryLabels";

/**
 * MAPA (§11, §58)
 * Leaflet + OpenStreetMap.
 *
 * CAMADA PUBLICA: recebe SOMENTE pontos ja agregados pelo servidor
 * (`/api/v1/map`). O cliente nunca recebe coordenada exata — a proteção é
 * feita no servidor, não no front, porque front é controlável pelo usuário.
 */

export type MapPoint = {
  key: string;
  category: string;
  status: string;
  period: string;
  count: number;
  lat: number;
  lng: number;
  precision: string;
};

export type MapMarker = {
  id: string;
  kind: "REPORT" | "ANIMAL" | "LOST" | "FOUND" | "ORG" | "CLINIC" | "EVENT";
  label: string;
  lat: number;
  lng: number;
  precision: string;
  meta?: string;
};

function colorFor(cat: string): string {
  if (cat === "DESCARTE_IRREGULAR_DE_CARCACAS") return "#991b1b";
  if (cat === "ANIMAL_FERIDO" || cat === "ATROPELAMENTO") return "#dc2626";
  if (cat === "SITUACAO_DE_RISCO" || cat === "ANIMAL_PRESO") return "#ea580c";
  if (cat === "AGRESSAO" || cat === "NEGLIGENCIA") return "#f59e0b";
  return "#14532d";
}

export default function MapView({
  points = [],
  markers = [],
  showHeatmap = true,
  height = 520,
}: {
  points?: MapPoint[];
  markers?: MapMarker[];
  showHeatmap?: boolean;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = L.map(ref.current, {
      center: [LAGES_CENTER.lat, LAGES_CENTER.lng],
      zoom: 13,
      scrollWheelZoom: false, // não sequestra a rolagem da página
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Área do município (bounding box aproximado) para não deixar vazar pra fora.
    const bounds = L.latLngBounds([-27.87, -50.40], [-27.75, -50.24]);
    map.setMaxBounds(bounds.pad(0.2));

    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* --- marcadores -------------------------------------------------------- */
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const m of markers) {
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:inline-block;width:14px;height:14px;border-radius:9999px;background:#14532d;border:2px solid #fff;box-shadow:0 1px 4px rgb(0 0 0 / .35)"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([m.lat, m.lng], { icon });
      marker.bindPopup(
        `<strong>${escapeHtml(m.label)}</strong><br/><small>${escapeHtml(m.meta ?? "")}</small><br/><small>Precisão: ${m.precision}</small>`,
      );
      marker.addTo(layer);
    }
  }, [markers]);

  /* --- pontos agregados + heatmap --------------------------------------- */
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const p of points) {
      const max = Math.max(1, ...points.map((x) => x.count));
      const r = 8 + Math.round((p.count / max) * 18);
      const color = colorFor(p.category);

      const circle = L.circle([p.lat, p.lng], {
        radius: r * 30,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.18,
      });
      circle.bindPopup(
        `<strong>${escapeHtml(CATEGORY_LABEL[p.category] ?? p.category)}</strong><br/>` +
          `${p.count} ocorrência(s) agregadas<br/>` +
          `<small>Período: ${escapeHtml(p.period)} · Status: ${escapeHtml(p.status)}<br/>` +
          `Precisão: agregada por região</small>`,
      );
      circle.addTo(layer);
    }
  }, [points]);

  /* --- heatmap em canvas (sem plugin: custo zero de dependência) --------- */
  useEffect(() => {
    if (!showHeatmap || !ref.current || points.length === 0) return;

    const canvas = document.createElement("canvas");
    canvas.className = "pointer-events-none absolute inset-0 z-[400] h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    ref.current.appendChild(canvas);
    heatRef.current = canvas;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const max = Math.max(1, ...points.map((p) => p.count));
      for (const p of points) {
        const xy = L.latLng(p.lat, p.lng);
        if (!mapRef.current) continue;
        const pt = mapRef.current.latLngToContainerPoint(xy);
        const r = 18 + (p.count / max) * 46;
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
        g.addColorStop(0, "rgba(220, 38, 38, 0.45)");
        g.addColorStop(0.5, "rgba(245, 158, 11, 0.22)");
        g.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();
    const map = mapRef.current;
    map?.on("moveend zoomend", draw);
    window.addEventListener("resize", draw);

    return () => {
      map?.off("moveend zoomend", draw);
      window.removeEventListener("resize", draw);
      canvas.remove();
      heatRef.current = null;
    };
  }, [points, showHeatmap]);

  return (
    <div
      ref={ref}
      style={{ height }}
      role="application"
      aria-label="Mapa de ocorrências agregadas de Lages. Use a lista textual para acesso por teclado."
      className="w-full rounded-xl border border-neutro-300 bg-neutro-100"
    />
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export { CATEGORY_LABEL };