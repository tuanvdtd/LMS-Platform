import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // bg-foreground/10 thay bg-muted: --muted trùng --card ở dark mode (và gần trùng ở light) nên thanh skeleton biến mất
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
