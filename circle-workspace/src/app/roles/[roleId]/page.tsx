import InfoCard from "@/components/InfoCard";
import { roles } from "@/data/roles";

type Props = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function RoleDetailPage({ params }: Props) {
  const { roleId } = await params;

  const role = roles.find((r) => r.id === roleId);

  if (!role) {
    return <div>役職が見つかりません。</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{role.name}</h1>
        <p className="mt-2 text-gray-500">{role.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="📋 仕事内容">
          <p>{role.overview}</p>
        </InfoCard>

        <InfoCard title="✅ 今月のタスク">
          <ul className="list-disc pl-5 space-y-1">
            {role.tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard title="📅 年間スケジュール">
          <ul className="list-disc pl-5 space-y-1">
            {role.schedule.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard title="📚 引継ぎ・資料">
          <ul className="list-disc pl-5 space-y-1">
            {role.documents.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </InfoCard>
      </div>
    </div>
  );
}