interface FunnelStep {
  name: string
  count: number
}

interface FunnelStepsProps {
  steps: FunnelStep[]
}

const STEP_COLORS: Record<string, string> = {
  Visits: "bg-blue-500",
  "Step 1 Submit": "bg-indigo-500",
  "Step 2 Submit": "bg-purple-500",
  "Payment Initiated": "bg-orange-500",
  "Payment Complete": "bg-green-500",
}

const STEP_TEXT_COLORS: Record<string, string> = {
  Visits: "text-blue-400",
  "Step 1 Submit": "text-indigo-400",
  "Step 2 Submit": "text-purple-400",
  "Payment Initiated": "text-orange-400",
  "Payment Complete": "text-green-400",
}

export function FunnelSteps({ steps }: FunnelStepsProps) {
  const topCount = steps[0]?.count ?? 0

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const previous = steps[index - 1]
        const isFirst = index === 0

        const conversionFromTop =
          topCount > 0 ? Math.round((step.count / topCount) * 100) : 0
        const dropOffFromPrev = previous ? previous.count - step.count : 0
        const conversionFromPrev =
          previous && previous.count > 0
            ? Math.round((step.count / previous.count) * 100)
            : 100

        const barWidth = topCount > 0 ? (step.count / topCount) * 100 : 0
        const colorClass = STEP_COLORS[step.name] ?? "bg-gray-500"
        const textColorClass = STEP_TEXT_COLORS[step.name] ?? "text-gray-400"

        return (
          <div
            key={step.name}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-gray-400 font-medium">{step.name}</p>
                <p className={`text-2xl font-bold mt-0.5 ${textColorClass}`}>
                  {step.count.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                {isFirst ? (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-medium">
                    Top of funnel
                  </span>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded font-medium">
                      {conversionFromTop}% of visits
                    </span>
                    <span className="text-xs text-gray-500">
                      {conversionFromPrev}% from prev &middot;{" "}
                      <span className="text-red-400">-{dropOffFromPrev.toLocaleString()} drop</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Progress bar — proportional to top-of-funnel visit count */}
            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
              <div
                className={`h-1.5 rounded-full transition-all ${colorClass}`}
                style={{ width: `${isFirst ? 100 : barWidth}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
