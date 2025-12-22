"use client";

export default function PaletteNode({
  data,
  onDragStart,
  orientation,
  nodeSize,
  disabled = false,
}) {
  const isSmall = nodeSize === "small";
  const isLandscape = orientation === "landscape";

  return (
    <div
      className={[
        "rounded-lg border-2 shadow-sm",
        "select-none transition-all duration-150",
        isSmall
          ? "px-2 py-1.5 w-full h-full"
          : "px-4 py-3 min-w-[160px] max-w-[210px]",
        disabled
          ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
          : "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
      ].join(" ")}
      onDragStart={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("application/reactflow", JSON.stringify(data));
        e.dataTransfer.effectAllowed = "move";
        if (onDragStart) onDragStart(e, data);
      }}
      draggable={!disabled}
      tabIndex={disabled ? -1 : 0}
    >
      <div
        className={[
          "flex items-center",
          isSmall ? "gap-1.5" : "gap-3",
          isLandscape ? "flex-row" : "flex-col",
        ].join(" ")}
      >
        <div className={isSmall ? "text-lg" : "text-2xl"}>
          {data?.icon || "📊"}
        </div>
        <div className={isSmall ? "flex-1 min-w-0" : "flex-1"}>
          <div
            className={[
              "font-semibold text-gray-900 leading-tight",
              isSmall ? "text-xs" : "text-sm",
            ].join(" ")}
          >
            {data?.title || "Node"}
          </div>
          {data?.subtitle && !isSmall && (
            <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">
              {data.subtitle}
            </div>
          )}
        </div>
      </div>
      {!isSmall && (
        <div className="mt-2 text-xs text-blue-700 font-medium">
          Drag ke canvas
        </div>
      )}
    </div>
  );
}
