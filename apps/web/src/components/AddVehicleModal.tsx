import {
  useEffect,
  useState,
} from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createVehicle,
} from "../api/vehicles.api";

import api from "../api/axios";


type Props = {
  open: boolean;
  onClose: () => void;
};


type Cooperative = {
  id: string;
  name: string;
  code?: string;
  active?: boolean;
};


type VehicleForm = {
  cooperativeId: string;
  plateNumber: string;
  bodyNumber: string;
  make: string;
  model: string;
  yearModel: string;
  color: string;
  seatCapacity: string;
};


const initialForm: VehicleForm = {
  cooperativeId: "",
  plateNumber: "",
  bodyNumber: "",
  make: "",
  model: "",
  yearModel: "",
  color: "",
  seatCapacity: "14",
};


function getErrorMessage(
  error: unknown,
): string {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return "Failed to create vehicle.";
  }

  const value =
    error as {
      response?: {
        data?:
          | {
              message?: string | string[];
            }
          | string;
      };
      message?: string;
    };

  const responseData =
    value.response?.data;

  if (
    typeof responseData === "string"
  ) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData === "object"
  ) {
    const message =
      responseData.message;

    if (
      Array.isArray(message)
    ) {
      return message.join(", ");
    }

    if (
      typeof message === "string"
    ) {
      return message;
    }
  }

  if (
    typeof value.message === "string" &&
    value.message.trim()
  ) {
    return value.message;
  }

  return "Failed to create vehicle.";
}


function normalizeArray<T>(
  value: unknown,
): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    const data =
      (
        value as {
          data?: unknown;
        }
      ).data;

    if (Array.isArray(data)) {
      return data as T[];
    }
  }

  return [];
}


export default function AddVehicleModal({
  open,
  onClose,
}: Props) {
  const queryClient =
    useQueryClient();

  const [
    form,
    setForm,
  ] = useState<VehicleForm>(
    initialForm,
  );

  const [
    error,
    setError,
  ] = useState("");


  const cooperativesQuery =
    useQuery<Cooperative[]>({
      queryKey: [
        "cooperatives",
      ],

      queryFn:
        async () => {
          const response =
            await api.get(
              "/cooperatives",
            );

          return normalizeArray<Cooperative>(
            response.data,
          );
        },

      enabled: open,

      staleTime:
        60_000,
    });


  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialForm,
    );

    setError("");
  }, [open]);


  const mutation =
    useMutation({
      mutationFn:
        createVehicle,

      onSuccess:
        async () => {
          await queryClient.invalidateQueries({
            queryKey: [
              "vehicles",
            ],
          });

          await queryClient.invalidateQueries({
            queryKey: [
              "drivers",
            ],
          });

          setForm(
            initialForm,
          );

          setError("");

          onClose();
        },

      onError:
        (caughtError) => {
          setError(
            getErrorMessage(
              caughtError,
            ),
          );
        },
    });


  function update(
    key: keyof VehicleForm,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }


  function validate(): string | null {
    if (
      !form.cooperativeId
    ) {
      return "Please select a cooperative.";
    }

    if (
      !form.plateNumber.trim()
    ) {
      return "Plate number is required.";
    }

    const seatCapacity =
      Number(
        form.seatCapacity,
      );

    if (
      !Number.isInteger(
        seatCapacity,
      ) ||
      seatCapacity <= 0
    ) {
      return "Seat capacity must be a positive whole number.";
    }

    if (
      form.yearModel.trim()
    ) {
      const year =
        Number(
          form.yearModel,
        );

      const currentYear =
        new Date().getFullYear();

      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > currentYear + 1
      ) {
        return `Year model must be between 1900 and ${currentYear + 1}.`;
      }
    }

    return null;
  }


  function submit() {
    setError("");

    const validationError =
      validate();

    if (validationError) {
      setError(
        validationError,
      );
      return;
    }

    mutation.mutate({
      cooperativeId:
        form.cooperativeId,

      plateNumber:
        form.plateNumber
          .trim()
          .toUpperCase(),

      bodyNumber:
        form.bodyNumber.trim() ||
        undefined,

      make:
        form.make.trim() ||
        undefined,

      model:
        form.model.trim() ||
        undefined,

      yearModel:
        form.yearModel.trim()
          ? Number(
              form.yearModel,
            )
          : undefined,

      color:
        form.color.trim() ||
        undefined,

      seatCapacity:
        Number(
          form.seatCapacity,
        ),
    });
  }


  function close() {
    if (
      mutation.isPending
    ) {
      return;
    }

    setForm(
      initialForm,
    );

    setError("");

    onClose();
  }


  if (!open) {
    return null;
  }


  const cooperatives =
    (
      cooperativesQuery.data ??
      []
    ).filter(
      (
        cooperative,
      ) =>
        cooperative.active !==
        false,
    );


  return (
    <div
      className="
        fixed
        inset-0
        z-[2000]
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          close();
        }
      }}
    >
      <div
        className="
          max-h-[92vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="
          sticky
          top-0
          z-10
          flex
          items-center
          justify-between
          border-b
          border-gray-100
          bg-white
          px-6
          py-5
        ">
          <div>
            <h2 className="
              text-xl
              font-bold
              text-gray-900
            ">
              Add Vehicle
            </h2>

            <p className="
              mt-1
              text-sm
              text-gray-500
            ">
              Register a UV and place it under
              an active cooperative.
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={
              mutation.isPending
            }
            className="
              rounded-full
              px-2
              text-2xl
              leading-none
              text-gray-400
              hover:bg-gray-100
              disabled:opacity-50
            "
            aria-label="Close"
          >
            ×
          </button>
        </div>


        <div className="
          space-y-6
          p-6
        ">
          {error && (
            <div className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-sm
              text-red-700
            ">
              {error}
            </div>
          )}


          <section>
            <h3 className="
              text-sm
              font-semibold
              uppercase
              tracking-wide
              text-gray-500
            ">
              Registration
            </h3>

            <div className="
              mt-4
              grid
              gap-4
              md:grid-cols-2
            ">
              <Field
                label="Plate Number"
                required
                value={
                  form.plateNumber
                }
                onChange={(value) =>
                  update(
                    "plateNumber",
                    value,
                  )
                }
                placeholder="TEST-123"
                disabled={
                  mutation.isPending
                }
              />

              <Field
                label="Body Number"
                value={
                  form.bodyNumber
                }
                onChange={(value) =>
                  update(
                    "bodyNumber",
                    value,
                  )
                }
                placeholder="UV-001"
                disabled={
                  mutation.isPending
                }
              />


              <div>
                <label className="
                  mb-1.5
                  block
                  text-sm
                  font-medium
                  text-gray-700
                ">
                  Cooperative
                  <span className="
                    ml-1
                    text-red-500
                  ">
                    *
                  </span>
                </label>

                <select
                  value={
                    form.cooperativeId
                  }
                  onChange={(event) =>
                    update(
                      "cooperativeId",
                      event.target.value,
                    )
                  }
                  disabled={
                    mutation.isPending ||
                    cooperativesQuery.isLoading
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-gray-900
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-gray-100
                  "
                >
                  <option value="">
                    {cooperativesQuery.isLoading
                      ? "Loading cooperatives..."
                      : "Select cooperative"}
                  </option>

                  {cooperatives.map(
                    (
                      cooperative,
                    ) => (
                      <option
                        key={
                          cooperative.id
                        }
                        value={
                          cooperative.id
                        }
                      >
                        {
                          cooperative.name
                        }
                        {cooperative.code
                          ? ` (${cooperative.code})`
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </div>


              <Field
                label="Color"
                value={
                  form.color
                }
                onChange={(value) =>
                  update(
                    "color",
                    value,
                  )
                }
                placeholder="White"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Make"
                value={
                  form.make
                }
                onChange={(value) =>
                  update(
                    "make",
                    value,
                  )
                }
                placeholder="Toyota"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Model"
                value={
                  form.model
                }
                onChange={(value) =>
                  update(
                    "model",
                    value,
                  )
                }
                placeholder="HiAce"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Year Model"
                type="number"
                value={
                  form.yearModel
                }
                onChange={(value) =>
                  update(
                    "yearModel",
                    value,
                  )
                }
                placeholder="2024"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Seat Capacity"
                type="number"
                required
                value={
                  form.seatCapacity
                }
                onChange={(value) =>
                  update(
                    "seatCapacity",
                    value,
                  )
                }
                placeholder="14"
                disabled={
                  mutation.isPending
                }
              />
            </div>
          </section>


          <div className="
            rounded-xl
            bg-blue-50
            p-4
            text-sm
            text-blue-800
          ">
            A QR token is generated by the backend
            for the vehicle. You do not need to enter
            one manually.
          </div>


          <div className="
            flex
            justify-end
            gap-3
            border-t
            border-gray-100
            pt-5
          ">
            <button
              type="button"
              onClick={close}
              disabled={
                mutation.isPending
              }
              className="
                rounded-xl
                border
                border-gray-300
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-gray-700
                hover:bg-gray-50
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={
                mutation.isPending ||
                cooperatives.length === 0
              }
              className="
                rounded-xl
                bg-blue-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {mutation.isPending
                ? "Creating..."
                : "Create Vehicle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="
        mb-1.5
        block
        text-sm
        font-medium
        text-gray-700
      ">
        {label}

        {required && (
          <span className="
            ml-1
            text-red-500
          ">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        disabled={disabled}
        className="
          w-full
          rounded-xl
          border
          border-gray-300
          bg-gray-50
          px-4
          py-3
          text-sm
          text-gray-900
          outline-none
          placeholder:text-gray-400
          focus:border-blue-500
          focus:bg-white
          focus:ring-2
          focus:ring-blue-100
          disabled:bg-gray-100
        "
      />
    </div>
  );
}