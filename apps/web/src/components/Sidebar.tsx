import {
  NavLink,
} from "react-router-dom";


import {
  useAuth,
} from "../auth/AuthContext";



type Role =
  | "ADMIN"
  | "DISPATCHER"
  | "DRIVER";




type SidebarLink = {

  name:string;

  path:string;

  roles:Role[];

};






const links:SidebarLink[] = [



  // ======================
  // ADMIN
  // ======================


  {
    name:"Dashboard",
    path:"/",
    roles:[
      "ADMIN"
    ],
  },



  {
    name:"Trips",
    path:"/trips",
    roles:[
      "ADMIN"
    ],
  },



  {
    name:"Drivers",
    path:"/drivers",
    roles:[
      "ADMIN"
    ],
  },



  {
    name:"Vehicles",
    path:"/vehicles",
    roles:[
      "ADMIN"
    ],
  },



  {
    name:"Dispatchers",
    path:"/dispatchers",
    roles:[
      "ADMIN"
    ],
  },



  {
    name:"Reports",
    path:"/reports",
    roles:[
      "ADMIN"
    ],
  },






  // ======================
  // DISPATCHER
  // ======================


  {
    name:"Dispatcher Console",
    path:"/dispatcher",
    roles:[
      "DISPATCHER"
    ],
  },





  // ======================
  // DRIVER (future)
  // ======================


  {
    name:"Driver Dashboard",
    path:"/driver",
    roles:[
      "DRIVER"
    ],
  },


];









export default function Sidebar(){



  const {
    user,
  } = useAuth();




  const role =
    user?.role as Role
    ??
    "ADMIN";





  const visibleLinks =
    links.filter(
      link =>
        link.roles.includes(role)
    );






  return (


    <aside

      className="
        w-64
        min-h-screen
        bg-white
        border-r
        p-6
      "

    >



      <h1

        className="
          text-2xl
          font-bold
          mb-2
        "

      >

        Terminalink

      </h1>





      <p

        className="
          mb-8
          text-sm
          text-gray-500
        "

      >

        {role}

      </p>








      <nav

        className="
          space-y-2
        "

      >



        {
          visibleLinks.map(
            link => (


              <NavLink


                key={
                  link.path
                }


                to={
                  link.path
                }



                className={({isActive}) =>

                  `

                  block
                  rounded-lg
                  px-4
                  py-3
                  text-sm
                  font-medium


                  ${
                    isActive

                    ?

                    "bg-blue-600 text-white"

                    :

                    "text-gray-600 hover:bg-gray-100"

                  }

                  `

                }


              >


                {
                  link.name
                }



              </NavLink>


            )
          )
        }



      </nav>



    </aside>


  );


}