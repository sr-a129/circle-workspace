import RoleCard from "@/components/RoleCard";
import { roles } from "@/data/roles";

export default function RolesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">役職一覧</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map((role) => (
            <RoleCard
                key={role.id}
                id={role.id}
                name={role.name}
                description={role.description}
            />
        ))}
      </div>
    </>
  );
}