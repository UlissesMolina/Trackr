import { ResponsiveSankey } from "@nivo/sankey";
import type { SankeyData } from "../../hooks/useDashboard";

interface SankeyChartProps {
  data: SankeyData;
}

const SHARED_PROPS = {
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
  linkOpacity: 0.25,
  linkHoverOpacity: 0.55,
  linkHoverOthersOpacity: 0.08,
  linkContract: 3,
  linkBlendMode: "normal" as const,
  enableLinkGradient: true,
  labelPosition: "outside" as const,
  labelPadding: 12,
  labelTextColor: "#e2e8f0",
  valueFormat: ((v: number) => `${v} app${v === 1 ? "" : "s"}`) as never,
  theme: {
    text: { fill: "#94a3b8", fontSize: 13 },
    tooltip: {
      container: {
        background: "#1e293b",
        color: "#f8fafc",
        borderRadius: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        fontSize: "13px",
        padding: "8px 12px",
      },
    },
  },
  animate: false,
};

export default function SankeyChart({ data }: SankeyChartProps) {
  return (
    <div className="relative h-full w-full">
      {/* Nodes + labels — always visible */}
      <div className="absolute inset-0">
        <ResponsiveSankey
          data={data}
          margin={{ top: 24, right: 180, bottom: 24, left: 180 }}
          {...SHARED_PROPS}
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
          {...SHARED_PROPS}
          enableLabels={false}
          layers={["links"]}
          isInteractive={false}
        />
      </div>
      {/* Interactive layer on top for tooltips */}
      <div className="absolute inset-0">
        <ResponsiveSankey
          data={data}
          margin={{ top: 24, right: 180, bottom: 24, left: 180 }}
          {...SHARED_PROPS}
          enableLabels={true}
          label={(node) => `${node.id}  (${node.value})`}
          nodeOpacity={0}
          linkOpacity={0}
          linkHoverOpacity={0.55}
          nodeHoverOpacity={1}
        />
      </div>
    </div>
  );
}
