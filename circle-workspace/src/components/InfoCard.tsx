type Props = {
  title: string;
  children: React.ReactNode;
};

export default function InfoCard({ title, children }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-3">
        {title}
      </h2>

      {children}
    </div>
  );
}