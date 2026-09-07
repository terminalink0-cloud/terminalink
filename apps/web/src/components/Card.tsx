interface CardProps {
  title: string;
  value: string | number;
}

export default function Card({
  title,
  value,
}: CardProps) {

  return (
    <div className="rounded-lg border bg-white p-6 shadow">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {value}
      </h2>

    </div>
  );

}