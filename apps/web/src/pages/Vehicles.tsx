import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


import {
  useNavigate,
} from "react-router-dom";


import {
  getVehicles,
  deleteVehicle,
  updateVehicle,
} from "../api/vehicles.api";



export default function Vehicles(){


  const queryClient =
    useQueryClient();


  const navigate =
    useNavigate();




  const {
    data:vehicles=[],
    isLoading,

  } =
  useQuery({

    queryKey:[
      "vehicles"
    ],

    queryFn:
      getVehicles,

  });








  const deleteMutation =
  useMutation({

    mutationFn:
      deleteVehicle,


    onSuccess(){

      queryClient.invalidateQueries({

        queryKey:[
          "vehicles"
        ],

      });

    },

  });








  const statusMutation =
  useMutation({

    mutationFn:
    ({
      id,
      data,
    }:any)=>

      updateVehicle(
        id,
        data
      ),



    onSuccess(){

      queryClient.invalidateQueries({

        queryKey:[
          "vehicles"
        ],

      });

    },

  });







  if(isLoading){

    return (

      <div className="p-6">

        Loading vehicles...

      </div>

    );

  }







  return (

    <div className="space-y-6">





      <div
        className="
          flex
          items-center
          justify-between
          rounded-xl
          bg-white
          p-6
          shadow-sm
        "
      >


        <div>

          <h1
            className="
              text-3xl
              font-bold
            "
          >

            Vehicles

          </h1>


          <p
            className="
              text-gray-500
            "
          >

            Manage registered transport vehicles.

          </p>


        </div>





        <button

          className="
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-white
          "

        >

          Add Vehicle

        </button>



      </div>









      <div
        className="
          overflow-hidden
          rounded-xl
          bg-white
          shadow-sm
        "
      >


        <table
          className="
            w-full
            text-left
          "
        >



          <thead>


            <tr
              className="
                border-b
                text-sm
                text-gray-500
              "
            >

              <th className="p-4">
                Plate Number
              </th>


              <th className="p-4">
                Body Number
              </th>


              <th className="p-4">
                Vehicle
              </th>


              <th className="p-4">
                Year
              </th>


              <th className="p-4">
                Seats
              </th>


              <th className="p-4">
                Status
              </th>


              <th className="p-4">
                Actions
              </th>


            </tr>


          </thead>








          <tbody>


          {
            vehicles.map(
              (vehicle:any)=>(


              <tr

                key={vehicle.id}

                className="
                  border-b
                  hover:bg-gray-50
                "

              >



                <td className="p-4">

                  {vehicle.plateNumber}

                </td>





                <td className="p-4">

                  {vehicle.bodyNumber}

                </td>






                <td className="p-4">


                  <div className="font-medium">

                    {vehicle.make}

                  </div>


                  <div className="text-sm text-gray-500">

                    {vehicle.model}

                  </div>


                </td>







                <td className="p-4">

                  {vehicle.yearModel}

                </td>






                <td className="p-4">

                  {vehicle.seatCapacity}

                </td>








                <td className="p-4">


                  <span
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-sm

                      ${
                        vehicle.status === "ACTIVE"

                        ?

                        "bg-green-100 text-green-700"

                        :

                        "bg-gray-100 text-gray-700"

                      }

                    `}
                  >

                    {vehicle.status}


                  </span>


                </td>








                <td className="p-4 space-x-2">



                  <button

                    onClick={()=>

                      navigate(
                        `/vehicles/${vehicle.id}`
                      )

                    }


                    className="
                      rounded
                      bg-gray-100
                      px-3
                      py-1
                      text-sm
                    "

                  >

                    View

                  </button>







                  <button

                    onClick={()=>


                      statusMutation.mutate({

                        id:
                        vehicle.id,


                        data:{

                          status:

                          vehicle.status === "ACTIVE"

                          ?

                          "INACTIVE"

                          :

                          "ACTIVE"

                        }

                      })


                    }


                    className="
                      rounded
                      bg-yellow-100
                      px-3
                      py-1
                      text-sm
                    "

                  >

                    {
                      vehicle.status === "ACTIVE"

                      ?

                      "Disable"

                      :

                      "Enable"
                    }


                  </button>







                  <button

                    onClick={()=>


                      deleteMutation.mutate(
                        vehicle.id
                      )


                    }


                    className="
                      rounded
                      bg-red-100
                      px-3
                      py-1
                      text-sm
                    "

                  >

                    Delete


                  </button>




                </td>




              </tr>


              )

            )

          }




          </tbody>



        </table>


      </div>




    </div>

  );

}