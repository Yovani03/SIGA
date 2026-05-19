import * as React from "react"
import { ResponsiveContainer, Tooltip, Legend } from "recharts"

const getPayloadConfigFromPayload = (config, payload, key) => {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }
  const payloadVal =
    payload[key] ??
    (payload.payload ? payload.payload[key] : undefined)

  let configKey = key
  if (key in payload && typeof payload[key] === "string") {
    configKey = payload[key]
  } else if (payloadVal in config) {
    configKey = payloadVal
  }

  return config[configKey] ?? config[key]
}

const ChartContainer = React.forwardRef(
  ({ id, className, config, children, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = id ?? `chart-${uniqueId}`

    const styles = React.useMemo(() => {
      const colorKeys = Object.keys(config).filter(
        (key) => config[key]?.color || config[key]?.theme
      )

      if (!colorKeys.length) {
        return null
      }

      return (
        <style>
          {colorKeys
            .map((key) => {
              const item = config[key]
              const color = item.color
              if (!color) return ""
              return `
                #${chartId} {
                  --color-${key}: ${color};
                }
              `
            })
            .join("\n")}
        </style>
      )
    }, [config, chartId])

    return (
      <div
        ref={ref}
        id={chartId}
        className={`relative w-full ${className || ""}`}
        {...props}
      >
        {styles}
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = Tooltip

const ChartTooltipContent = React.forwardRef(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      hideLabel = false,
      hideIndicator = false,
      config,
    },
    ref
  ) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={`grid min-w-[8rem] items-start gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-xl dark:border-slate-800 dark:bg-slate-950 ${
          className || ""
        }`}
      >
        {!hideLabel && (
          <div className={`font-medium text-slate-500 dark:text-slate-400 ${labelClassName || ""}`}>
            {labelFormatter ? labelFormatter(label, payload) : label}
          </div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = item.name || item.dataKey
            const itemConfig = getPayloadConfigFromPayload(config || {}, item, key)
            const itemColor = color || item.payload?.fill || item.color

            return (
              <div
                key={index}
                className="flex w-full items-center gap-2 text-slate-900 dark:text-slate-50"
              >
                {!hideIndicator && (
                  <div
                    className="h-2 w-2 rounded-[2px]"
                    style={{
                      backgroundColor: itemColor,
                    }}
                  />
                )}
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">
                    {itemConfig?.label || item.name}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
                    {formatter
                      ? formatter(item.value, item.name, item, index, payload)
                      : item.value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = Legend

const ChartLegendContent = React.forwardRef(
  ({ className, payload, verticalAlign = "bottom", config }, ref) => {
    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={`flex flex-wrap items-center justify-center gap-4 pt-3 ${
          className || ""
        }`}
      >
        {payload.map((item, index) => {
          const key = item.value
          const itemConfig = getPayloadConfigFromPayload(config || {}, item, key)
          const itemColor = item.color

          return (
            <div
              key={index}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <div
                className="h-2 w-2 rounded-[2px]"
                style={{
                  backgroundColor: itemColor,
                }}
              />
              <span>{itemConfig?.label || item.value}</span>
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
