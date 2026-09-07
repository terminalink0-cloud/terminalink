import {
  useQuery,
} from "@tanstack/react-query";


import {
  useNavigate,
  useParams,
} from "react-router-dom";


import {
  getVehicle,
} from "../api/vehicles.api";





export default function VehicleDetails(){


  const {
    id,

  } = useParams();



  const navigate =
    useNavigate();






  const {
    data:vehicle,
    isLoading,

  }
  =
  useQuery({

    queryKey:[
      "vehicle",
      id
    ],


    queryFn:
      ()=>getVehicle(id!),


    enabled:
      !!id,


  });







  if(isLoading){

    return (

      <div className="p-6">

        Loading vehicle...

      </div>

    );

  }






  if(!vehicle){

    return (

      <div className="p-6">

        Vehicle not found.

      </div>

    );

  }







  return (

    <div className="space-y-6">





      <button

        onClick={()=>navigate(-1)}

        className="
          rounded-lg
          bg-gray-200
          px-4
          py-2
        "

      >

        ← Back

      </button>








      <div
        className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        "
      >


        <h1 className="text-3xl font-bold">

          {vehicle.plateNumber}

        </h1>


        <p className="text-gray-500">

          Body Number:

          {" "}

          {vehicle.bodyNumber}

        </p>




        <span
          className="
            mt-3
            inline-block
            rounded-full
            bg-green-100
            px-3
            py-1
            text-green-700
          "
        >

          {vehicle.status}

        </span>



      </div>









      <div className="grid gap-6 md:grid-cols-2">





        <div
          className="
            rounded-xl
            bg-white
            p-6
            shadow-sm
          "
        >

          <h2 className="mb-4 text-xl font-bold">

            Vehicle Information

          </h2>


          <p>

            Make:

            <strong>
              {" "}
              {vehicle.make}
            </strong>

          </p>


          <p>

            Model:

            <strong>
              {" "}
              {vehicle.model}
            </strong>

          </p>


          <p>

            Year:

            <strong>
              {" "}
              {vehicle.yearModel}
            </strong>

          </p>


          <p>

            Seats:

            <strong>
              {" "}
              {vehicle.seatCapacity}
            </strong>

          </p>


        </div>







        <div
          className="
            rounded-xl
            bg-white
            p-6
            shadow-sm
          "
        >

          <h2 className="mb-4 text-xl font-bold">

            QR / Registration

          </h2>


          <p>

            QR Token:

          </p>


          <p className="text-sm text-gray-500 break-all">

            {vehicle.qrToken}

          </p>


        </div>




      </div>








      <div
        className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        "
      >

        <h2 className="mb-4 text-xl font-bold">

          Trip History

        </h2>




        {
          vehicle.trips?.length

          ?

          <table className="w-full text-left">


            <thead>

              <tr className="border-b text-gray-500">

                <th className="p-3">
                  Trip
                </th>


                <th className="p-3">
                  Status
                </th>


                <th className="p-3">
                  Date
                </th>


              </tr>


            </thead>



            <tbody>


            {
              vehicle.trips.map(
                (trip:any)=>(

                <tr
                  key={trip.id}
                  className="border-b"
                >

                  <td className="p-3">

                    {trip.tripNumber}

                  </td>


                  <td className="p-3">

                    {trip.status}

                  </td>


                  <td className="p-3">

                    {
                      new Date(
                        trip.createdAt
                      )
                      .toLocaleDateString()
                    }

                  </td>


                </tr>

              ))

            }


            </tbody>


          </table>


          :

          <p className="text-gray-500">

            No trips found.

          </p>

        }



      </div>





    </div>

  );

}