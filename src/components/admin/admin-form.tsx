import { useId } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { polishBody, polishLabel, polishTitle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export const adminControlClass =
  "h-10 rounded-lg border-border/80 bg-card shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/45 focus-visible:ring-primary/35";

export const adminTextareaClass =
  "min-h-[88px] rounded-lg border-border/80 bg-card shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/45 focus-visible:ring-primary/35";

export function FormLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 space-y-0.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground/90"
      >
        {children}
      </label>
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  polish = "label",
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  polish?: "title" | "body" | "label" | "none";
  hint?: string;
  className?: string;
}) {
  const id = useId();
  const applyPolish = (raw: string) => {
    if (polish === "none") return raw;
    if (polish === "title") return polishTitle(raw);
    if (polish === "body") return polishBody(raw);
    return polishLabel(raw);
  };

  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <FormLabel htmlFor={id} hint={hint}>
          {label}
        </FormLabel>
      ) : null}
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const next = applyPolish(value);
          if (next !== value) onChange(next);
        }}
        placeholder={placeholder}
        className={adminControlClass}
      />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 3,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <FormLabel htmlFor={id} hint={hint}>
          {label}
        </FormLabel>
      ) : null}
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const next = polishBody(value);
          if (next !== value) onChange(next);
        }}
        rows={rows}
        className={adminTextareaClass}
      />
    </div>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; description?: string }[];
  hint?: string;
  placeholder?: string;
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <div className="min-w-0">
      <FormLabel hint={hint}>{label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn(adminControlClass, "w-full")}>
          <SelectValue placeholder={placeholder ?? polishLabel("Выберите")}>
            {selected?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="border-border bg-popover">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="cursor-pointer focus:bg-primary/15 focus:text-foreground"
            >
              <div className="flex flex-col gap-0.5 py-0.5">
                <span>{opt.label}</span>
                {opt.description ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {opt.description}
                  </span>
                ) : null}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <FormLabel hint={hint}>{label}</FormLabel>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-1 rounded-xl border border-border/80 bg-background/50 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  hideHeader = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** When section title already lives in admin tabs. */
  hideHeader?: boolean;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card/35 p-5 sm:p-6">
      {!hideHeader ? (
        <div className="mb-5 border-b border-border/60 pb-4">
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : description ? (
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

export function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function ItemCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background/55 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">{title}</p>
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-red-400"
            aria-label={polishLabel("Удалить")}
          >
            <X className="size-3.5" />
            <span className="hidden sm:inline">{polishLabel("Удалить")}</span>
          </Button>
        ) : null}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}

export function MediaPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 space-y-3 overflow-hidden rounded-xl border border-dashed border-border/80 bg-card/40 p-4",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function StatusMessage({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "break-words rounded-lg px-3 py-2 text-sm leading-relaxed",
        tone === "success" && "bg-primary/10 text-primary",
        tone === "error" && "bg-red-500/10 text-red-400",
        tone === "info" && "bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}

export function FileMeta({ name, url }: { name: string; url?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground" title={name}>
          {name}
        </p>
        {url ? (
          <p className="truncate text-xs text-muted-foreground" title={url}>
            {url}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : url;
  } catch {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  }
}
