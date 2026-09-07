import {
  useParams,
} from "react-router-dom";


import {
  useQuery,
} from "@tanstack/react-query";


import {
  getTrip,
} from "../api/trips.api";



export default function TripDetails(){


  const {
    id,
  } = useParams();



  const {
    data,
    isLoading,
  } =
  useQuery({

    queryKey:[
      "trip",
      id
    ],

    queryFn:()=>getTrip(id!),

    enabled:!!id,

  });



  if(isLoading){

    return (
      <div className="p-6">
        Loading trip...
      </div>
    );

  }



  if(!data){

    return (
      <div className="p-6 text-red-600">
        Trip not found
      </div>
    );

  }




  return (

    <div className="space-y-6">



      <div
        className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        "
      >

        <h1 className="text-3xl font-bold">
          Trip Details
        </h1>


        <p className="text-gray-500">
          {data.tripNumber}
        </p>

      </div>




      <div
        className="
          grid
          gap-6
          md:grid-cols-3
        "
      >



        <div className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="font-semibold">
            Driver
          </h2>


          <p className="mt-2">
            {
              data.driver?.user?.displayName
            }
          </p>


          <p className="text-sm text-gray-500">

            {
              data.driver?.licenseNumber
            }

          </p>


        </div>




        <div className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="font-semibold">
            Vehicle
          </h2>


          <p>
            {
              data.vehicle?.plateNumber
            }
          </p>


          <p className="text-sm text-gray-500">

            {
              data.vehicle?.make
            }{" "}
            {
              data.vehicle?.model
            }

          </p>


        </div>




        <div className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="font-semibold">
            Status
          </h2>


          <span
            className="
              inline-block
              mt-2
              rounded-full
              bg-green-100
              px-3
              py-1
              text-green-700
            "
          >

            {data.status}

          </span>


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

        <h2 className="mb-4 text-xl font-semibold">
          Passengers
        </h2>


        {
          data.boardings?.map(
            (item:any)=>(
              
              <div
                key={item.id}
                className="
                  border-b
                  py-3
                "
              >

                Seat {item.seatNumber}
                -
                {" "}
                {item.passengerName}

              </div>

            )
          )
        }


      </div>





      <div
        className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        "
      >

        <h2 className="mb-4 text-xl font-semibold">
          Timeline
        </h2>



        {
          data.gateEvents?.map(
            (event:any)=>(
              
              <div
                key={event.id}
                className="
                  mb-4
                  border-l-4
                  pl-4
                "
              >

                <p className="font-medium">

                  {
                    new Date(
                      event.scannedAt
                    )
                    .toLocaleTimeString()
                  }

                </p>


                <p>
                  {event.remarks}
                </p>


              </div>

            )
          )
        }



      </div>



    </div>

  );

}