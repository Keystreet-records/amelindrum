import { Check, Circle, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { polishLabel } from "@/lib/typography";
import { cn } from "@/lib/utils";

export type UploadTimelineStatus = "preparing" | "uploading" | "done" | "error";

export type UploadTimelineState = {
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadTimelineStatus;
  errorMessage?: string;
};

type StepStatus = "pending" | "active" | "done" | "error";

type Step = {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function buildSteps(state: UploadTimelineState): Step[] {
  const { status, progress, errorMessage } = state;

  const prepare: StepStatus =
    status === "preparing" ? "active" : status === "error" && progress <= 0 ? "error" : "done";

  let upload: StepStatus = "pending";
  if (status === "uploading") upload = "active";
  else if (status === "done") upload = "done";
  else if (status === "error" && progress > 0) upload = "error";
  else if (status === "preparing") upload = "pending";
  else if (status === "error") upload = "pending";

  const finish: StepStatus =
    status === "done" ? "done" : status === "error" && upload === "done" ? "error" : "pending";

  return [
    {
      id: "prepare",
      label: polishLabel("Подготовка"),
      status: prepare,
                  detail: prepare === "active" ? polishLabel("Оптимизация и сессия…") : undefined,
    },
    {
      id: "upload",
      label: polishLabel("Загрузка файла"),
      status: upload,
      detail:
        upload === "active"
          ? `${Math.round(progress)}%`
          : upload === "error"
            ? errorMessage
            : undefined,
    },
    {
      id: "finish",
      label: polishLabel("Готово"),
      status: finish,
      detail: finish === "done" ? polishLabel("Файл на сервере") : undefined,
    },
  ];
}

function StepDot({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ember/60 bg-background text-ember shadow-[0_0_0_3px_color-mix(in_oklab,var(--ember)_18%,transparent)]">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-500/90 text-white">
        <X className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
      <Circle className="size-2.5 fill-current" aria-hidden />
    </span>
  );
}

export function UploadTimelineLoader({
  state,
  className,
}: {
  state: UploadTimelineState;
  className?: string;
}) {
  const steps = buildSteps(state);
  const busy = state.status === "preparing" || state.status === "uploading";
  const showBar = state.status === "uploading" || state.status === "done";

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-background/50 p-3",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy={busy}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={state.fileName}>
            {state.fileName}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(state.fileSize)}</p>
        </div>
        <span
          className={cn(
            "shrink-0 text-xs",
            state.status === "error" && "text-red-400",
            state.status === "done" && "text-primary",
            busy && "text-muted-foreground",
          )}
        >
          {state.status === "preparing" && polishLabel("Подготовка…")}
          {state.status === "uploading" && polishLabel("Загрузка…")}
          {state.status === "done" && polishLabel("Загружено")}
          {state.status === "error" && polishLabel("Ошибка")}
        </span>
      </div>

      {showBar && (
        <div className="mb-3 space-y-1.5">
          <Progress value={state.progress} className="h-1.5" />
          <p className="text-right font-mono text-[11px] text-muted-foreground">
            {Math.round(state.progress)}%
          </p>
        </div>
      )}

      <ol className="m-0 flex list-none flex-col gap-0 p-0">
        {steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-3 pb-3 last:pb-0">
            {index < steps.length - 1 && (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-border"
                aria-hidden
              />
            )}
            <StepDot status={step.status} />
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm leading-5",
                  step.status === "pending" && "text-muted-foreground",
                  step.status === "active" && "font-medium text-foreground",
                  step.status === "done" && "text-foreground",
                  step.status === "error" && "font-medium text-red-400",
                )}
              >
                {step.label}
              </p>
              {step.detail && (
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    step.status === "error" ? "text-red-400" : "text-muted-foreground",
                  )}
                >
                  {step.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
