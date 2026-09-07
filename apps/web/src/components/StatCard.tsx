import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
};

export default function StatCard({
  title,
  value,
  icon,
  description,
}: StatCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        shadow-md
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-xl
      "
    >

      <div className="flex items-start justify-between">

        <div className="flex-1">

          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>


          <h2
            className="
              mt-3
              text-4xl
              font-bold
              tracking-tight
              text-gray-900
            "
          >
            {value}
          </h2>


          {description && (
            <p className="mt-2 text-sm text-gray-500">
              {description}
            </p>
          )}

        </div>


        {icon && (
          <div
            className="
              ml-4
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-xl
              bg-blue-100
              text-2xl
              text-blue-600
            "
          >
            {icon}
          </div>
        )}

      </div>

    </div>
  );
}