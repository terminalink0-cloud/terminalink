
// apps/web/src/pages/DispatcherRoutes.tsx

import {
  useQuery,
} from "@tanstack/react-query";

import {
  getRoutes,
} from "../api/routes.api";

type RouteItem = {
  id: string;
  name?: string;
  code?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;

  origin?: {
    id?: string;
    name?: string;
  };

  destination?: {
    id?: string;
    name?: string;
  };
};

function getLocationName(
  location:
    | {
        id?: string;
        name?: string;
      }
    | undefined,
): string {
  if (
    location &&
    typeof location.name === "string" &&
    location.name.trim().length > 0
  ) {
    return location.name;
  }

  return "-";
}

export default function DispatcherRoutes() {
  const {
    data,
    isLoading,
    isError,
  } = useQuery<RouteItem[]>({
    queryKey: ["dispatcher-routes"],
    queryFn: getRoutes,
    refetchInterval: 30000,
  });

  const routes = Array.isArray(data)
    ? data
    : [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        ">
          Loading routes...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-red-50
          p-5
          text-red-700
        ">
          <h2 className="font-semibold">
            Unable to load routes.
          </h2>

          <p className="mt-2 text-sm">
            Verify that the API is running and
            the dispatcher is authenticated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
      ">
        <h1 className="
          text-3xl
          font-bold
          text-gray-900
        ">
          Routes
        </h1>

        <p className="
          mt-2
          text-gray-500
        ">
          View routes available for dispatcher
          operations.
        </p>
      </div>

      <div className="
        overflow-hidden
        rounded-xl
        bg-white
        shadow-sm
      ">
        <div className="
          border-b
          p-6
        ">
          <div className="
            flex
            items-center
            justify-between
            gap-4
          ">
            <div>
              <h2 className="
                text-xl
                font-bold
                text-gray-900
              ">
                Available Routes
              </h2>

              <p className="
                mt-1
                text-sm
                text-gray-500
              ">
                {routes.length} route
                {routes.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {routes.length === 0 ? (
          <div className="
            p-10
            text-center
          ">
            <h3 className="
              text-lg
              font-medium
              text-gray-700
            ">
              No routes found.
            </h3>

            <p className="
              mt-2
              text-sm
              text-gray-500
            ">
              Routes created by administration
              will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="
              w-full
              min-w-[850px]
              text-left
            ">
              <thead>
                <tr className="
                  border-b
                  text-sm
                  text-gray-500
                ">
                  <th className="p-4">
                    Route
                  </th>

                  <th className="p-4">
                    Origin
                  </th>

                  <th className="p-4">
                    Destination
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                  <th className="p-4">
                    ID
                  </th>
                </tr>
              </thead>

              <tbody>
                {routes.map(
                  (route) => (
                    <tr
                      key={route.id}
                      className="
                        border-b
                        hover:bg-gray-50
                      "
                    >
                      <td className="p-4">
                        <div className="
                          font-semibold
                          text-gray-900
                        ">
                          {
                            route.name ??
                            route.code ??
                            "Unnamed route"
                          }
                        </div>

                        {route.code && (
                          <div className="
                            mt-1
                            text-sm
                            text-gray-500
                          ">
                            {route.code}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {
                          getLocationName(
                            route.origin,
                          )
                        }
                      </td>

                      <td className="p-4">
                        {
                          getLocationName(
                            route.destination,
                          )
                        }
                      </td>

                      <td className="p-4">
                        <span className={`
                          inline-flex
                          rounded-full
                          px-3
                          py-1
                          text-sm
                          font-medium
                          ${
                            route.active === false
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }
                        `}>
                          {
                            route.active === false
                              ? "Inactive"
                              : "Active"
                          }
                        </span>
                      </td>

                      <td className="
                        max-w-[240px]
                        break-all
                        p-4
                        font-mono
                        text-xs
                        text-gray-500
                      ">
                        {route.id}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
