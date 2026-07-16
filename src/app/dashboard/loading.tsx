function SkeletonLine({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded bg-surface-muted ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <main
      className="min-h-screen bg-background text-foreground"
      aria-busy="true"
      aria-label="Carregando Dashboard Principal"
    >
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="h-20 w-20 shrink-0 rounded-md bg-surface-muted sm:h-24 sm:w-24"
            />
            <div className="min-w-0 space-y-2">
              <SkeletonLine className="h-5 w-48 max-w-full" />
              <SkeletonLine className="h-7 w-64 max-w-full" />
              <SkeletonLine className="h-5 w-72 max-w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 lg:w-[28rem]">
            <SkeletonLine className="h-12 flex-1" />
            <SkeletonLine className="h-12 w-12 shrink-0" />
            <SkeletonLine className="h-12 w-20 shrink-0" />
          </div>
        </header>

        <p className="text-sm text-muted" role="status" aria-live="polite">
          Carregando os indicadores comerciais...
        </p>

        <section className="grid gap-3 border-y border-border py-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2 px-3">
              <SkeletonLine className="h-4 w-28" />
              <SkeletonLine className="h-7 w-36 max-w-full" />
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-6 w-72 max-w-full" />
              <SkeletonLine className="h-4 w-96 max-w-full" />
            </div>
            <SkeletonLine className="h-11 w-40" />
          </div>
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2 px-4 py-3">
                <SkeletonLine className="h-4 w-32 max-w-full" />
                <SkeletonLine className="h-7 w-20" />
              </div>
            ))}
          </div>
          <div className="grid items-start gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_9.5rem]">
            <div className="dashboard-pipeline-strip">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="min-h-32 space-y-3 border-t-2 border-border bg-surface-muted p-3"
                >
                  <SkeletonLine className="h-4 w-24 max-w-full bg-border" />
                  <SkeletonLine className="h-8 w-12 bg-border" />
                  <SkeletonLine className="h-4 w-20 bg-border" />
                  <SkeletonLine className="h-4 w-28 max-w-full bg-border" />
                </div>
              ))}
            </div>
            <div className="min-h-32 space-y-3 border border-dashed border-border bg-background p-3">
              <SkeletonLine className="h-4 w-28 max-w-full" />
              <SkeletonLine className="h-8 w-12" />
              <SkeletonLine className="h-4 w-24 max-w-full" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-md border border-border bg-surface"
            >
              <div className="space-y-2 border-b border-border px-4 py-3">
                <SkeletonLine className="h-5 w-64 max-w-full" />
                <SkeletonLine className="h-4 w-80 max-w-full" />
              </div>
              <div className="space-y-4 p-4">
                {Array.from({ length: 3 }, (_, rowIndex) => (
                  <SkeletonLine
                    key={rowIndex}
                    className="h-10 w-full"
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
