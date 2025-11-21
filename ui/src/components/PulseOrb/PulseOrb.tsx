import { useKernelSignal } from "../../sage/kernel/useKernelSignal";

export default function PulseOrb() {
  const hb = useKernelSignal("kernel.pulse.ui");

  return (
    <div className={`fixed bottom-6 right-6 w-6 h-6 rounded-full 
      bg-purple-500/60 shadow-lg transition-all duration-300
      ${hb ? "scale-125 opacity-100" : "scale-100 opacity-70"}
    `} />
  );
}

