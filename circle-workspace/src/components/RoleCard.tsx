import Link from "next/link";

type Props = {
  id: string;
  name: string;
  description: string;
};

export default function RoleCard({
  id,
  name,
  description,
}: Props) {
  return (
    <Link href={`/roles/${id}`}>
      <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
        <h2 className="text-xl font-semibold">
          {name}
        </h2>

        <p className="text-gray-500 mt-2">
          {description}
        </p>
      </div>
    </Link>
  );
}