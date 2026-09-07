// apps/web/src/components/AddDriverModal.tsx

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
  createDriver,
} from "../api/driver.api";

import api from "../api/axios";


// ============================================================
// TYPES
// ============================================================

type Props = {
  open: boolean;
  onClose: () => void;
};


type Cooperative = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};


type DriverForm = {
  username: string;
  password: string;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  cooperativeId: string;

  licenseNumber: string;
  licenseExpiry: string;

  emergencyContact: string;
  emergencyPhone: string;
};


const initialForm: DriverForm = {
  username: "",
  password: "",

  firstName: "",
  lastName: "",

  email: "",
  phone: "",

  cooperativeId: "",

  licenseNumber: "",
  licenseExpiry: "",

  emergencyContact: "",
  emergencyPhone: "",
};


// ============================================================
// ERROR HELPER
// ============================================================

function getErrorMessage(
  error: unknown,
): string {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return "Failed to create driver.";
  }


  const value =
    error as {
      response?: {
        data?:
          | {
              message?:
                | string
                | string[];
            }
          | string;
      };

      message?: string;
    };


  const responseData =
    value.response?.data;


  if (
    typeof responseData ===
    "string"
  ) {
    return responseData;
  }


  if (
    responseData &&
    typeof responseData ===
      "object"
  ) {
    const message =
      responseData.message;


    if (
      Array.isArray(
        message,
      )
    ) {
      return message.join(
        ", ",
      );
    }


    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }


  if (
    typeof value.message ===
      "string" &&
    value.message.trim()
  ) {
    return value.message;
  }


  return "Failed to create driver.";
}


// ============================================================
// MAIN
// ============================================================

export default function AddDriverModal({
  open,
  onClose,
}: Props) {
  const queryClient =
    useQueryClient();


  const [
    form,
    setForm,
  ] = useState<DriverForm>(
    initialForm,
  );


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // COOPERATIVES
  // ==========================================================

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


          return Array.isArray(
            response.data,
          )
            ? response.data
            : [];
        },

      enabled:
        open,
    });


  // ==========================================================
  // RESET FORM WHEN OPENING
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }


    setForm(
      initialForm,
    );

    setError("");
  }, [open]);


  // ==========================================================
  // CREATE DRIVER
  // ==========================================================

  const mutation =
    useMutation({
      mutationFn:
        createDriver,

      onSuccess:
        async () => {
          await queryClient.invalidateQueries({
            queryKey: [
              "drivers",
            ],
          });


          await queryClient.invalidateQueries({
            queryKey: [
              "driver-profile",
            ],
          });


          await queryClient.invalidateQueries({
            queryKey: [
              "driver-trips",
            ],
          });


          setForm(
            initialForm,
          );

          setError("");

          onClose();
        },

      onError:
        (
          caughtError,
        ) => {
          setError(
            getErrorMessage(
              caughtError,
            ),
          );
        },
    });


  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  function update(
    key: keyof DriverForm,
    value: string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,
        [key]:
          value,
      }),
    );
  }


  // ==========================================================
  // VALIDATION
  // ==========================================================

  function validateForm(): string | null {
    if (
      !form.username.trim()
    ) {
      return "Username is required.";
    }


    if (
      form.username.trim().length <
      3
    ) {
      return "Username must be at least 3 characters.";
    }


    if (
      !form.password
    ) {
      return "Password is required.";
    }


    if (
      form.password.length <
      6
    ) {
      return "Password must be at least 6 characters.";
    }


    if (
      !form.firstName.trim()
    ) {
      return "First name is required.";
    }


    if (
      !form.lastName.trim()
    ) {
      return "Last name is required.";
    }


    if (
      !form.cooperativeId
    ) {
      return "Please select a cooperative.";
    }


    if (
      !form.licenseNumber.trim()
    ) {
      return "License number is required.";
    }


    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      return "Please enter a valid email address.";
    }


    return null;
  }


  // ==========================================================
  // SUBMIT
  // ==========================================================

  function submit() {
    setError("");


    const validationError =
      validateForm();


    if (
      validationError
    ) {
      setError(
        validationError,
      );

      return;
    }


    mutation.mutate({
      username:
        form.username.trim(),

      password:
        form.password,

      firstName:
        form.firstName.trim(),

      lastName:
        form.lastName.trim(),

      email:
        form.email.trim() ||
        undefined,

      phone:
        form.phone.trim() ||
        undefined,

      cooperativeId:
        form.cooperativeId,

      licenseNumber:
        form.licenseNumber.trim(),

      licenseExpiry:
        form.licenseExpiry ||
        undefined,

      emergencyContact:
        form.emergencyContact.trim() ||
        undefined,

      emergencyPhone:
        form.emergencyPhone.trim() ||
        undefined,

      isActive:
        true,
    });
  }


  // ==========================================================
  // CLOSE
  // ==========================================================

  function handleClose() {
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


  // ==========================================================
  // ACTIVE COOPERATIVES
  // ==========================================================

  const cooperatives =
    (
      cooperativesQuery.data ??
      []
    ).filter(
      (
        cooperative,
      ) =>
        cooperative.active,
    );


  // ==========================================================
  // RENDER
  // ==========================================================

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
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
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
        onMouseDown={(
          event,
        ) => {
          event.stopPropagation();
        }}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

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
              Add Driver
            </h2>


            <p className="
              mt-1
              text-sm
              text-gray-500
            ">
              Create the driver's login account
              and driver profile.
            </p>

          </div>


          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              mutation.isPending
            }
            className="
              rounded-full
              px-2
              text-2xl
              leading-none
              text-gray-400
              transition-colors
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* ==================================================
            BODY
        ================================================== */}

        <div className="
          p-6
        ">

          {error && (
            <div
              role="alert"
              className="
                mb-6
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-4
                text-sm
                text-red-700
              "
            >
              {error}
            </div>
          )}


          {/* =================================================
              LOGIN ACCOUNT
          ================================================= */}

          <section>

            <div className="
              mb-4
            ">

              <h3 className="
                text-sm
                font-semibold
                uppercase
                tracking-wide
                text-gray-500
              ">
                Login Account
              </h3>


              <p className="
                mt-1
                text-xs
                text-gray-400
              ">
                These credentials will be used
                by the driver to access Terminalink.
              </p>

            </div>


            <div className="
              grid
              gap-4
              md:grid-cols-2
            ">

              <Field
                label="Username"
                required
                value={
                  form.username
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "username",
                    value,
                  )
                }
                placeholder="driver01"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Password"
                required
                type="password"
                value={
                  form.password
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "password",
                    value,
                  )
                }
                placeholder="At least 6 characters"
                disabled={
                  mutation.isPending
                }
              />

            </div>

          </section>


          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="
            mt-7
            border-t
            border-gray-100
            pt-6
          ">

            <h3 className="
              text-sm
              font-semibold
              uppercase
              tracking-wide
              text-gray-500
            ">
              Personal Information
            </h3>


            <div className="
              mt-4
              grid
              gap-4
              md:grid-cols-2
            ">

              <Field
                label="First Name"
                required
                value={
                  form.firstName
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "firstName",
                    value,
                  )
                }
                placeholder="Juan"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Last Name"
                required
                value={
                  form.lastName
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "lastName",
                    value,
                  )
                }
                placeholder="Dela Cruz"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Email"
                type="email"
                value={
                  form.email
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "email",
                    value,
                  )
                }
                placeholder="driver@example.com"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Phone"
                value={
                  form.phone
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "phone",
                    value,
                  )
                }
                placeholder="09XXXXXXXXX"
                disabled={
                  mutation.isPending
                }
              />

            </div>

          </section>


          {/* =================================================
              DRIVER PROFILE
          ================================================= */}

          <section className="
            mt-7
            border-t
            border-gray-100
            pt-6
          ">

            <h3 className="
              text-sm
              font-semibold
              uppercase
              tracking-wide
              text-gray-500
            ">
              Driver Profile
            </h3>


            <div className="
              mt-4
              grid
              gap-4
              md:grid-cols-2
            ">

              {/* COOPERATIVE */}

              <div>

                <label
                  htmlFor="driver-cooperative"
                  className="
                    mb-1.5
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Cooperative

                  <span className="
                    ml-1
                    text-red-500
                  ">
                    *
                  </span>
                </label>


                <select
                  id="driver-cooperative"
                  value={
                    form.cooperativeId
                  }
                  onChange={(
                    event,
                  ) => {
                    update(
                      "cooperativeId",
                      event.target.value,
                    );
                  }}
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
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:cursor-not-allowed
                    disabled:bg-gray-100
                  "
                >

                  <option value="">
                    {
                      cooperativesQuery.isLoading
                        ? "Loading cooperatives..."
                        : "Select cooperative"
                    }
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
                        {" ("}
                        {
                          cooperative.code
                        }
                        {")"}
                      </option>
                    ),
                  )}

                </select>


                {!cooperativesQuery.isLoading &&
                  cooperatives.length ===
                    0 && (
                    <p className="
                      mt-1.5
                      text-xs
                      text-red-600
                    ">
                      No active cooperatives are
                      available. Create or activate
                      a cooperative first.
                    </p>
                  )}

              </div>


              <Field
                label="License Number"
                required
                value={
                  form.licenseNumber
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "licenseNumber",
                    value,
                  )
                }
                placeholder="LICENSE-001"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="License Expiry"
                type="date"
                value={
                  form.licenseExpiry
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "licenseExpiry",
                    value,
                  )
                }
                disabled={
                  mutation.isPending
                }
              />

            </div>

          </section>


          {/* =================================================
              EMERGENCY CONTACT
          ================================================= */}

          <section className="
            mt-7
            border-t
            border-gray-100
            pt-6
          ">

            <h3 className="
              text-sm
              font-semibold
              uppercase
              tracking-wide
              text-gray-500
            ">
              Emergency Contact
            </h3>


            <div className="
              mt-4
              grid
              gap-4
              md:grid-cols-2
            ">

              <Field
                label="Emergency Contact"
                value={
                  form.emergencyContact
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "emergencyContact",
                    value,
                  )
                }
                placeholder="Contact person"
                disabled={
                  mutation.isPending
                }
              />


              <Field
                label="Emergency Phone"
                value={
                  form.emergencyPhone
                }
                onChange={(
                  value,
                ) =>
                  update(
                    "emergencyPhone",
                    value,
                  )
                }
                placeholder="09XXXXXXXXX"
                disabled={
                  mutation.isPending
                }
              />

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="
            mt-7
            flex
            justify-end
            gap-3
            border-t
            border-gray-100
            pt-5
          ">

            <button
              type="button"
              onClick={
                handleClose
              }
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
                transition-colors
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="button"
              onClick={
                submit
              }
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
                shadow-sm
                transition-colors
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {
                mutation.isPending
                  ? "Creating Driver..."
                  : "Create Driver"
              }
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  value,
  onChange,
  placeholder,
  type =
    "text",
  required =
    false,
  disabled =
    false,
}: {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  placeholder?: string;

  type?: string;

  required?: boolean;

  disabled?: boolean;
}) {
  return (
    <div>

      <label
        className="
          mb-1.5
          block
          text-sm
          font-medium
          text-gray-700
        "
      >

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
        type={
          type
        }
        value={
          value
        }
        onChange={(
          event,
        ) => {
          onChange(
            event.target.value,
          );
        }}
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
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
          transition
          placeholder:text-gray-400
          focus:border-blue-500
          focus:bg-white
          focus:ring-2
          focus:ring-blue-100
          disabled:cursor-not-allowed
          disabled:bg-gray-100
          disabled:text-gray-500
        "
      />

    </div>
  );
}