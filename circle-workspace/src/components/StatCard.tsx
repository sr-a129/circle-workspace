type Props = {
  title: string;
  value: number;
  subtitle: string;
  color?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  color = "text-blue-600",
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <h2 className={`text-5xl font-bold mt-3 ${color}`}>
        {value}
      </h2>

      <p className="text-gray-500 mt-2">
        {subtitle}
      </p>
    </div>
  );
}