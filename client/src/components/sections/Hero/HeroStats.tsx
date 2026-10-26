interface Stat {
  label: string;
  value: string;
}

const STATS: readonly Stat[] = [
  { label: "POLLING RATE", value: "1000Hz" },
  { label: "FORCE", value: "40-100gf" },
];

export default function HeroStats() {
  return (
    <dl className="flex flex-row justify-center gap-10 lg:flex-col lg:items-end lg:gap-8">
      {STATS.map(({ label, value }) => (
        <div key={label} className="text-center lg:text-right">
          <dt className="text-xs tracking-widest text-gray-400">{label}</dt>
          <dd className="mt-1 text-brand text-4xl font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
