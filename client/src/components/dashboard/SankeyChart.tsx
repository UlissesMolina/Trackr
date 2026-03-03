import { ResponsiveSankey } from "@nivo/sankey";
import type { SankeyData } from "../../hooks/useDashboard";
import { useTheme } from "../../hooks/useTheme";

interface SankeyChartProps {
  data: SankeyData;
}

export default function SankeyChart({ data }: SankeyChartProps) {
  const { theme } = useTheme();
  const light = theme === "light";

  const sharedProps = {
    align: "justify" as const,
    sort: "input" as const,
    colors: ((node: unknown) => (node as { nodeColor?: string }).nodeColor ?? "#94a3b8") as never,
    nodeOpacity: 1,
    nodeHoverOpacity: 1,
    nodeHoverOthersOpacity: 0.3,
    nodeThickness: 18,
    nodeSpacing: 20,
    nodeInnerPadding: 3,
    nodeBorderWidth: 0,
    nodeBorderRadius: 3,
    linkOpacity: light ? 0.38 : 0.25,
    linkHoverOpacity: light ? 0.68 : 0.55,
    linkHoverOthersOpacity: light ? 0.1 : 0.08,
    linkContract: 3,
    linkBlendMode: "normal" as const,
    enableLinkGradient: true,
    labelPosition: "outside" as const,
    labelPadding: 12,
    labelTextColor: light ? "#1e293b" : "#e2e8f0",
    valueFormat: ((v: number) => `${v} app${v === 1 ? "" : "s"}`) as never,
    theme: {
      text: {
        fill: light ? "#475569" : "#94a3b8",
        fontSize: 13,
      },
      tooltip: {
        container: {
          background: light ? "#ffffff" : "#1e293b",
          color: light ? "#0f172a" : "#f8fafc",
          borderRadius: "8px",
          boxShadow: light
            ? "0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)"
            : "0 4px 20px rgba(0,0,0,0.4)",
          fontSize: "13px",
          padding: "8px 12px",
        },
      },
    },
    animate: false,
  };

  return (
    <div className="relative h-full w-full">
      {/* Nodes + labels — always visible */}
      <div className="absolute inset-0">
        <ResponsiveSankey
          data={data}
          margin={{ top: 24, right: 180, bottom: 24, left: 180 }}
          {...sharedProps}
          enableLabels={true}
          label={(node) => `${node.id}  (${node.value})`}
          layers={["nodes", "labels"]}
          isInteractive={false}
        />
      </div>
      {/* Links — revealed left to right */}
      <div className="sankey-reveal absolute inset-0">
        <ResponsiveSankey
          data={data}
          margin={{ top: 24, right: 180, bottom: 24, left: 180 }}
          {...sharedProps}
          enableLabels={false}
          layers={["links"]}
          isInteractive={false}
        />
      </div>
      {/* Interactive layer for tooltips */}
      <div className="absolute inset-0">
        <ResponsiveSankey
          data={data}
          margin={{ top: 24, right: 180, bottom: 24, left: 180 }}
          {...sharedProps}
          enableLabels={true}
          label={(node) => `${node.id}  (${node.value})`}
          nodeOpacity={0}
          linkOpacity={0}
          linkHoverOpacity={light ? 0.68 : 0.55}
          nodeHoverOpacity={1}
        />
      </div>
    </div>
  );
}
