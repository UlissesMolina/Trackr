import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSankeyData, type SankeyData } from "../hooks/useDashboard";
import SankeyChart from "../components/dashboard/SankeyChart";

const WATERMARK = "usetrackr.netlify.app";
const WATERMARK_H = 32;
const BG = "#131316";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getMergedSvg(container: HTMLDivElement): SVGSVGElement | null {
  const svgs = container.querySelectorAll("svg");
  if (svgs.length === 0) return null;

  const base = svgs[0].cloneNode(true) as SVGSVGElement;

  if (svgs.length >= 2) {
    const linksChildren = Array.from(svgs[1].children);
    const firstChild = base.firstChild;
    for (const child of linksChildren) {
      base.insertBefore(child.cloneNode(true), firstChild);
    }
  }

  return base;
}

function stampSvg(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const w = parseFloat(
    clone.getAttribute("width") || String(svg.getBoundingClientRect().width)
  );
  const h = parseFloat(
    clone.getAttribute("height") || String(svg.getBoundingClientRect().height)
  );
  const newH = h + WATERMARK_H;

  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(newH));
  clone.setAttribute("viewBox", `0 0 ${w} ${newH}`);
  clone.style.backgroundColor = BG;

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "0");
  rect.setAttribute("y", String(h));
  rect.setAttribute("width", String(w));
  rect.setAttribute("height", String(WATERMARK_H));
  rect.setAttribute("fill", BG);
  clone.appendChild(rect);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", String(w / 2));
  text.setAttribute("y", String(h + WATERMARK_H * 0.7));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", "#64748b");
  text.setAttribute("font-size", "13");
  text.setAttribute("font-family", "system-ui, sans-serif");
  text.textContent = WATERMARK;
  clone.appendChild(text);

  return clone;
}

function exportSvg(container: HTMLDivElement) {
  const svg = getMergedSvg(container);
  if (!svg) return;
  const clone = stampSvg(svg);
  const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
  downloadBlob(blob, "trackr-flow.svg");
}

function exportPng(container: HTMLDivElement) {
  const svg = getMergedSvg(container);
  if (!svg) return;

  const firstSvg = container.querySelector("svg")!;
  const { width, height } = firstSvg.getBoundingClientRect();
  const clone = stampSvg(svg);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height + WATERMARK_H));

  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([serialized], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height + WATERMARK_H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((b) => {
      if (b) downloadBlob(b, "trackr-flow.png");
    }, "image/png");
  };
  img.src = url;
}

/* ── Node filtering ──────────────────────────────────────────────── */

function filterSankeyData(
  data: SankeyData,
  hidden: Set<string>
): SankeyData {
  if (hidden.size === 0) return data;

  let links = data.links.map((l) => ({ ...l }));
  let nodes = [...data.nodes];

  for (const id of hidden) {
    const incoming = links.filter((l) => l.target === id);
    const outgoing = links.filter((l) => l.source === id);
    const totalIn = incoming.reduce((s, l) => s + l.value, 0);

    const bridged: typeof links = [];

    if (totalIn > 0 && outgoing.length > 0) {
      for (const out of outgoing) {
        for (const inc of incoming) {
          const v = Math.round(out.value * (inc.value / totalIn));
          if (v <= 0) continue;
          const existing = bridged.find(
            (l) => l.source === inc.source && l.target === out.target
          );
          if (existing) existing.value += v;
          else
            bridged.push({ source: inc.source, target: out.target, value: v });
        }
      }
    } else if (totalIn === 0 && outgoing.length > 0) {
      for (const out of outgoing) {
        const targetOut = links.filter(
          (l) => l.source === out.target && l.target !== id
        );
        const targetOutSum = targetOut.reduce((s, l) => s + l.value, 0);
        const remainder = out.value - targetOutSum;
        if (remainder > 0) {
          const sinkId = `At ${out.target}`;
          bridged.push({ source: out.target, target: sinkId, value: remainder });
          if (!nodes.find((n) => n.id === sinkId)) {
            const color =
              nodes.find((n) => n.id === out.target)?.nodeColor ?? "#94a3b8";
            nodes.push({ id: sinkId, nodeColor: color });
          }
        }
      }
    }

    links = links
      .filter((l) => l.source !== id && l.target !== id)
      .concat(bridged);
    nodes = nodes.filter((n) => n.id !== id);
  }

  const linked = new Set(links.flatMap((l) => [l.source, l.target]));
  nodes = nodes.filter((n) => linked.has(n.id));
  return { nodes, links };
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function SankeyPage() {
  const { data, isLoading } = useSankeyData();
  const chartRef = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    if (!data) return data;
    return filterSankeyData(data, hiddenNodes);
  }, [data, hiddenNodes]);

  const hasData =
    filteredData && filteredData.nodes.length > 0 && filteredData.links.length > 0;

  function toggleNode(nodeId: string) {
    setHiddenNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  function handleExport(format: "svg" | "png") {
    if (!chartRef.current) return;
    if (format === "svg") exportSvg(chartRef.current);
    else exportPng(chartRef.current);
    setExportOpen(false);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Application Flow</h1>
          <p className="mt-1 hidden text-sm text-text-secondary sm:block">
            Visualize how your applications move through each stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasData && (
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-border-default bg-surface-secondary py-1 shadow-lg">
                    <button
                      onClick={() => handleExport("png")}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-tertiary"
                    >
                      <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs font-medium text-text-secondary">PNG</span>
                      High-res image
                    </button>
                    <button
                      onClick={() => handleExport("svg")}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-tertiary"
                    >
                      <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs font-medium text-text-secondary">SVG</span>
                      Vector file
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <Link
            to="/board"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Go to Board
          </Link>
        </div>
      </div>

      {/* Stage toggles */}
      {data && data.nodes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Stages
          </span>
          {data.nodes.map((node) => {
            const hidden = hiddenNodes.has(node.id);
            return (
              <button
                key={node.id}
                onClick={() => toggleNode(node.id)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all"
                style={{
                  borderColor: hidden ? "transparent" : node.nodeColor,
                  backgroundColor: hidden ? "rgba(100,116,139,0.1)" : `${node.nodeColor}18`,
                  color: hidden ? "#64748b" : node.nodeColor,
                  opacity: hidden ? 0.5 : 1,
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: hidden ? "#64748b" : node.nodeColor }}
                />
                {node.id}
                {hidden && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            );
          })}
          {hiddenNodes.size > 0 && (
            <button
              onClick={() => setHiddenNodes(new Set())}
              className="ml-1 rounded-full px-2.5 py-1 text-xs text-text-tertiary hover:bg-surface-elevated hover:text-text-secondary transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[700px] rounded-xl border border-border-default bg-surface-secondary p-4 sm:p-6">
          {isLoading ? (
            <div className="flex h-[500px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-accent" />
            </div>
          ) : !hasData ? (
            <div className="flex h-[500px] flex-col items-center justify-center gap-4 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-tertiary text-text-tertiary">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-text-primary">
                  {hiddenNodes.size > 0 ? "All stages hidden" : "No flow data yet"}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {hiddenNodes.size > 0
                    ? "Toggle some stages back on to see your diagram."
                    : "Move applications between stages on the board to build your flow."}
                </p>
              </div>
              {hiddenNodes.size > 0 ? (
                <button
                  onClick={() => setHiddenNodes(new Set())}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  Show all stages
                </button>
              ) : (
                <Link
                  to="/board"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  Go to Board
                </Link>
              )}
            </div>
          ) : (
            <div ref={chartRef} className="h-[500px]">
              <SankeyChart data={filteredData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
