import type { TripReport } from "../api/trips.api";


type Props = {
  trips: TripReport[];
};


export default function TripsTable({
  trips,
}: Props) {

  return (
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

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Passenger
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Driver
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Vehicle
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Status
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Fare
            </th>

          </tr>

        </thead>


        <tbody>

          {trips.map((trip) => (

            <tr
              key={trip.id}
              className="border-b hover:bg-gray-50"
            >

              <td className="px-6 py-4">
                {trip.passengerName}
              </td>


              <td className="px-6 py-4">
                {trip.driverName}
              </td>


              <td className="px-6 py-4">
                {trip.vehicleNumber}
              </td>


              <td className="px-6 py-4">

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
                  {trip.status}
                </span>

              </td>


              <td className="px-6 py-4 font-medium">
                ₱{trip.fare}
              </td>


            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}