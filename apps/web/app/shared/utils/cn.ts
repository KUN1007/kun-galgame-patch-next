// KunUI's cn, not a local twMerge: plain tailwind-merge does not know the
// scales KunUI mints in @theme / @utility, so `cn('rounded-kun-md',
// 'rounded-full')` kept both classes and CSS source order picked the winner —
// and `shadow-kun-md` was classified as a shadow *colour*, so it cancelled
// against `shadow-primary/20` and the box-shadow was the class dropped.
// @kungal/ui-core registers those names (2.27.0); re-exporting keeps one merge
// behaviour across the app and the components.
export { cn } from '@kungal/ui-core'
