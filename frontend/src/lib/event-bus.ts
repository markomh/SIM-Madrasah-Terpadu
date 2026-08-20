export function mutateEvent(entity: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(`mutate-${entity}`));
  }
}
