
// apps/web/src/pages/DriverProfile.tsx

import {
  useQuery,
} from "@tanstack/react-query";

import {
  getMyDriverProfile,
} from "../api/driver.api";


type DriverProfileData = {
  id: string;

  userId: string;

  licenseNumber?: string | null;

  licenseExpiry?: string | null;

  emergencyContact?: string | null;

  emergencyPhone?: string | null;

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;

  user?: {
    id?: string;

    username?: string;

    role?: string;

    status?: string;

    firstName?: string | null;

    middleName?: string | null;

    lastName?: string | null;

    displayName?: string | null;

    phone?: string | null;

    email?: string | null;

    lastLoginAt?: string | null;

    createdAt?: string;

    updatedAt?: string;
  };

  cooperative?: {
    id?: string;

    name?: string;

    code?: string;
  };
};


function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString();
}


function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      bg-gray-50
      p-4
    ">
      <div className="
        text-xs
        font-medium
        uppercase
        tracking-wide
        text-gray-500
      ">
        {label}
      </div>

      <div className="
        mt-2
        break-words
        font-semibold
        text-gray-900
      ">
        {value}
      </div>
    </div>
  );
}


function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex",
        "rounded-full",
        "px-3",
        "py-1",
        "text-sm",
        "font-medium",
        active
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700",
      ].join(" ")}
    >
      {active
        ? "ACTIVE"
        : "INACTIVE"}
    </span>
  );
}


export default function DriverProfile() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<DriverProfileData>({
    queryKey: [
      "driver-profile",
    ],

    queryFn:
      getMyDriverProfile,

    refetchInterval:
      30_000,
  });


  if (isLoading) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        ">
          Loading your profile...
        </div>
      </div>
    );
  }


  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-red-50
          p-5
          text-red-700
        ">
          <h2 className="
            font-semibold
          ">
            Unable to load your driver profile.
          </h2>

          <button
            type="button"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
            className="
              mt-4
              rounded-lg
              bg-red-600
              px-4
              py-2
              text-sm
              font-medium
              text-white
              hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isFetching
              ? "Refreshing..."
              : "Retry"}
          </button>
        </div>
      </div>
    );
  }


  const user =
    data.user;

  const displayName =
    user?.displayName ||
    [
      user?.firstName,
      user?.middleName,
      user?.lastName,
    ]
      .filter(
        (
          value,
        ) =>
          typeof value ===
            "string" &&
          value.trim().length >
            0,
      )
      .join(" ") ||
    "Driver";


  return (
    <div className="
      space-y-6
    ">

      {/* HEADER */}

      <div className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
      ">

        <div className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        ">

          <div>

            <div className="
              text-sm
              font-medium
              text-gray-500
            ">
              Driver Profile
            </div>

            <h1 className="
              mt-1
              text-3xl
              font-bold
              text-gray-900
            ">
              {displayName}
            </h1>

            <p className="
              mt-2
              text-gray-500
            ">
              Your driver account and employment information.
            </p>

          </div>


          <div className="
            flex
            items-center
            gap-3
          ">

            <StatusBadge
              active={
                data.isActive
              }
            />

            <button
              type="button"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-gray-700
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isFetching
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

        </div>
      </div>


      {/* ACCOUNT */}

      <section className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
      ">

        <h2 className="
          text-xl
          font-bold
          text-gray-900
        ">
          Account Information
        </h2>

        <div className="
          mt-5
          grid
          gap-4
          md:grid-cols-2
          xl:grid-cols-3
        ">

          <InfoCard
            label="Display Name"
            value={
              displayName
            }
          />

          <InfoCard
            label="Username"
            value={
              user?.username ??
              "-"
            }
          />

          <InfoCard
            label="Role"
            value={
              user?.role ??
              "DRIVER"
            }
          />

          <InfoCard
            label="Account Status"
            value={
              user?.status ??
              "-"
            }
          />

          <InfoCard
            label="Phone"
            value={
              user?.phone ??
              "-"
            }
          />

          <InfoCard
            label="Email"
            value={
              user?.email ??
              "-"
            }
          />

        </div>
      </section>


      {/* DRIVER DETAILS */}

      <section className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
      ">

        <h2 className="
          text-xl
          font-bold
          text-gray-900
        ">
          Driver Information
        </h2>

        <div className="
          mt-5
          grid
          gap-4
          md:grid-cols-2
          xl:grid-cols-3
        ">

          <InfoCard
            label="License Number"
            value={
              data.licenseNumber ??
              "-"
            }
          />

          <InfoCard
            label="License Expiry"
            value={
              formatDate(
                data.licenseExpiry,
              )
            }
          />

          <InfoCard
            label="Emergency Contact"
            value={
              data.emergencyContact ??
              "-"
            }
          />

          <InfoCard
            label="Emergency Phone"
            value={
              data.emergencyPhone ??
              "-"
            }
          />

          <InfoCard
            label="Cooperative"
            value={
              data.cooperative?.name ??
              data.cooperative?.code ??
              "-"
            }
          />

          <InfoCard
            label="Driver Profile Created"
            value={
              formatDate(
                data.createdAt,
              )
            }
          />

        </div>
      </section>


      {/* SYSTEM INFORMATION */}

      <section className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
      ">

        <h2 className="
          text-xl
          font-bold
          text-gray-900
        ">
          System Information
        </h2>

        <div className="
          mt-5
          grid
          gap-4
          md:grid-cols-2
        ">

          <InfoCard
            label="Driver Profile ID"
            value={
              data.id
            }
          />

          <InfoCard
            label="User ID"
            value={
              data.userId
            }
          />

          <InfoCard
            label="Last Login"
            value={
              formatDate(
                user?.lastLoginAt,
              )
            }
          />

          <InfoCard
            label="Profile Updated"
            value={
              formatDate(
                data.updatedAt,
              )
            }
          />

        </div>
      </section>

    </div>
  );
}
```

And change the driver route in `apps/web/src/routes/AppRouter.tsx`.

Add:

```tsx
import DriverProfile
  from "../pages/DriverProfile";
```

Then replace:

```tsx
<Route
  path="/driver/profile"
  element={
    <DriverDashboard />
  }
/>
```

with:

```tsx
<Route
  path="/driver/profile"
  element={
    <DriverProfile />
  }
/>
```

Your driver pages are now properly separated:

```text
Dashboard → DriverDashboard.tsx
My Trips  → DriverTrips.tsx
Profile   → DriverProfile.tsx

