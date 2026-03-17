import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  label: string;
  sublabel?: string;
}

export default function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2.5,
  label,
  sublabel,
}: AnimatedCounterProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent leading-none mb-1">
        {prefix}
        {inView ? (
          <CountUp end={end} duration={duration} decimals={decimals} separator="," />
        ) : (
          "0"
        )}
        {suffix}
      </div>
      <div className="text-white font-semibold text-sm md:text-base mt-1">{label}</div>
      {sublabel && <div className="text-gray-400 text-xs mt-0.5">{sublabel}</div>}
    </div>
  );
}
