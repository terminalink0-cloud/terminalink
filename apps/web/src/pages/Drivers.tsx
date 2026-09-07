import {
  useState,
} from "react";


import {
  useNavigate,
} from "react-router-dom";


import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


import {
  getDrivers,
  deleteDriver,
  updateDriver,
} from "../api/driver.api";


import AddDriverModal from "../components/AddDriverModal";
import EditDriverModal from "../components/EditDriverModal";



export default function Drivers(){


  const navigate =
    useNavigate();



  const queryClient =
    useQueryClient();




  const [addOpen,setAddOpen] =
    useState(false);



  const [editOpen,setEditOpen] =
    useState(false);



  const [selectedDriver,setSelectedDriver] =
    useState<any>(null);








  const {
    data:drivers=[],
    isLoading,
  } =
  useQuery({

    queryKey:[
      "drivers"
    ],

    queryFn:
      getDrivers,

  });








  const deleteMutation =
    useMutation({


      mutationFn:
        deleteDriver,


      onSuccess(){

        queryClient.invalidateQueries({

          queryKey:[
            "drivers"
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
      }:{
        id:string;
        data:any;
      })=>

        updateDriver(
          id,
          data
        ),




      onSuccess(){

        queryClient.invalidateQueries({

          queryKey:[
            "drivers"
          ],

        });

      },


    });









  function removeDriver(
    id:string
  ){


    if(
      window.confirm(
        "Delete this driver?"
      )
    ){

      deleteMutation.mutate(id);

    }


  }









  function toggleStatus(
    driver:any
  ){


    statusMutation.mutate({

      id:
        driver.id,


      data:{

        isActive:
          !driver.isActive

      }

    });


  }









  if(isLoading){

    return (

      <div className="p-6">

        Loading drivers...

      </div>

    );

  }








  return (

    <div className="space-y-6">







      {/* HEADER */}


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


          <h1 className="text-3xl font-bold">

            Drivers

          </h1>



          <p className="text-gray-500">

            Manage registered drivers.

          </p>


        </div>





        <button

          onClick={()=>
            setAddOpen(true)
          }

          className="
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-white
            hover:bg-blue-700
          "

        >

          Add Driver

        </button>



      </div>












      {/* TABLE */}



      <div

        className="
          overflow-hidden
          rounded-xl
          bg-white
          shadow-sm
        "

      >



        <table className="w-full text-left">



          <thead>


            <tr

              className="
                border-b
                text-sm
                text-gray-500
              "

            >


              <th className="p-4">
                Driver
              </th>


              <th className="p-4">
                Username
              </th>


              <th className="p-4">
                License
              </th>


              <th className="p-4">
                Expiry
              </th>


              <th className="p-4">
                Emergency
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
            drivers.length === 0

            ?

            (

              <tr>

                <td

                  colSpan={7}

                  className="
                    p-6
                    text-center
                    text-gray-500
                  "

                >

                  No drivers found.

                </td>

              </tr>

            )


            :


            drivers.map(
              (driver:any)=>(


              <tr

                key={driver.id}

                className="
                  border-b
                  hover:bg-gray-50
                "

              >




                <td className="p-4">

                  {
                    driver.user?.displayName
                    ??
                    "-"
                  }

                </td>






                <td className="p-4">

                  {
                    driver.user?.username
                    ??
                    "-"
                  }

                </td>






                <td className="p-4">

                  {
                    driver.licenseNumber
                    ??
                    "-"
                  }

                </td>







                <td className="p-4">


                  {
                    driver.licenseExpiry

                    ?

                    new Date(
                      driver.licenseExpiry
                    )
                    .toLocaleDateString()

                    :

                    "-"

                  }


                </td>








                <td className="p-4">


                  <div>

                    {
                      driver.emergencyContact
                      ??
                      "-"
                    }

                  </div>


                  <div

                    className="
                      text-sm
                      text-gray-500
                    "

                  >

                    {
                      driver.emergencyPhone
                      ??
                      "-"
                    }


                  </div>



                </td>







                <td className="p-4">


                  <span

                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-sm

                      ${
                        driver.isActive

                        ?

                        "bg-green-100 text-green-700"

                        :

                        "bg-gray-100 text-gray-700"

                      }

                    `}

                  >

                    {
                      driver.isActive
                      ?
                      "ACTIVE"
                      :
                      "INACTIVE"
                    }


                  </span>



                </td>









                <td className="p-4">


                  <div className="flex gap-2">





                    <button

                      onClick={()=>

                        navigate(
                          `/drivers/${driver.id}`
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


                      onClick={()=>{

                        setSelectedDriver(
                          driver
                        );

                        setEditOpen(true);

                      }}


                      className="
                        rounded
                        bg-blue-100
                        px-3
                        py-1
                        text-sm
                        text-blue-700
                      "

                    >

                      Edit

                    </button>







                    <button


                      onClick={()=>
                        toggleStatus(driver)
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
                        driver.isActive
                        ?
                        "Disable"
                        :
                        "Enable"
                      }


                    </button>








                    <button


                      onClick={()=>
                        removeDriver(
                          driver.id
                        )
                      }


                      className="
                        rounded
                        bg-red-100
                        px-3
                        py-1
                        text-sm
                        text-red-600
                      "

                    >

                      Delete

                    </button>




                  </div>



                </td>







              </tr>


              )

            )

          }



          </tbody>



        </table>



      </div>









      {/* ADD DRIVER */}


      <AddDriverModal

        open={addOpen}

        onClose={()=>{

          setAddOpen(false);

        }}

      />









      {/* EDIT DRIVER */}


      <EditDriverModal


        open={editOpen}


        driver={selectedDriver}


        onClose={()=>{

          setEditOpen(false);

          setSelectedDriver(null);

        }}


      />






    </div>

  );

}