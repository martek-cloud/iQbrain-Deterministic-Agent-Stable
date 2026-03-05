interface Props {
  visible: boolean;
}

export function StreamingCursor({ visible }: Props) {
  if (!visible) return null;
  return (
    <span
      className="inline-block w-[9px] h-[14px] bg-amber-400 ml-0.5 align-middle animate-blink"
      aria-hidden="true"
    />
  );
}
