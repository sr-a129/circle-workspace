type Props = {
  title: string;
  category: string;
  due: string;
  color: string;
};

export default function TaskItem({
  title,
  category,
  due,
  color,
}: Props) {
  return (
    <div className="flex justify-between items-center border-b py-4">

      <div className="flex items-start gap-3">

        <div
          className={`w-3 h-3 rounded-full mt-2 ${color}`}
        />

        <div>
          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="text-gray-500 text-sm">
            {category}
          </p>
        </div>

      </div>

      <span className="text-sm text-orange-500">
        {due}
      </span>

    </div>
  );
}