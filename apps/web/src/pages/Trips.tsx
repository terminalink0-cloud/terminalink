import { useQuery } from "@tanstack/react-query";

import api from "../api/axios";
import { Link } from "react-router-dom";

type Trip = {
  id: string;
  tripNumber: string;
  status: string;
  completedAt: string | null;

  driver: {
    user: {
      displayName: string;
    };
  };

  vehicle: {
    plateNumber: string;
    make: string;
    model: string;
  };

  boardings: {
    passengerName: string;
  }[];
};


export default function Trips() {


  const {
    data,
    isLoading,
    isError,
  } = useQuery<Trip[]>({

    queryKey: ["trips"],

    queryFn: async () => {

      const response =
        await api.get("/reports/trips");

      console.log(
        "TRIPS DATA:",
        response.data
      );

      return response.data;

    },

  });



  if (isLoading) {

    return (
      <div className="p-6">
        Loading trips...
      </div>
    );

  }



  if (isError) {

    return (
      <div className="p-6 text-red-600">
        Failed loading trips.
      </div>
    );

  }



  return (

    <div className="space-y-6">


      {/* Header */}

      <div
        className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
        "
      >

        <h1
          className="
          text-3xl
          font-bold
          "
        >
          Trips
        </h1>


        <p className="mt-2 text-gray-500">
          View and manage passenger trips.
        </p>

      </div>



      {/* Table */}

      <div
        className="
        overflow-hidden
        rounded-xl
        border
        bg-white
        shadow-sm
        "
      >

        <table className="w-full">


          <thead
            className="
            border-b
            bg-gray-50
            "
          >

            <tr>


              <th className="p-4 text-left">
                Passenger
              </th>


              <th className="p-4 text-left">
                Driver
              </th>


              <th className="p-4 text-left">
                Vehicle
              </th>


              <th className="p-4 text-left">
                Status
              </th>


              <th className="p-4 text-left">
                Trip Number
              </th>


              <th className="p-4 text-left">
                Date
              </th>


            </tr>

          </thead>



          <tbody>


            {data?.map((trip) => (

              <tr
                key={trip.id}
                className="
                border-b
                hover:bg-gray-50
                "
              >


                <td className="p-4">

                  {
                    trip.boardings?.[0]
                      ?.passengerName
                    ??
                    "No passenger"
                  }

                </td>



                <td className="p-4">

                  {
                    trip.driver
                      ?.user
                      ?.displayName
                    ??
                    "No driver"
                  }

                </td>



                <td className="p-4">

                  <div>

                    <p className="font-medium">

                      {
                        trip.vehicle
                        ?.plateNumber
                      }

                    </p>


                    <p
                      className="
                      text-sm
                      text-gray-500
                      "
                    >

                      {
                        trip.vehicle
                        ?.make
                      }
                      {" "}
                      {
                        trip.vehicle
                        ?.model
                      }

                    </p>


                  </div>


                </td>




                <td className="p-4">


                  <span
                    className="
                    rounded-full
                    bg-green-100
                    px-3
                    py-1
                    text-sm
                    text-green-700
                    "
                  >

                    {
                      trip.status
                    }

                  </span>


                </td>



                <td className="p-4">

                  <Link
  to={`/trips/${trip.id}`}
  className="text-blue-600 hover:underline"
>
  {trip.tripNumber}
</Link>

                </td>



                <td className="p-4">


                  {
                    trip.completedAt
                    ?
                    new Date(
                      trip.completedAt
                    )
                    .toLocaleDateString()
                    :
                    "-"
                  }


                </td>


              </tr>


            ))}


          </tbody>


        </table>


      </div>


    </div>

  );

}