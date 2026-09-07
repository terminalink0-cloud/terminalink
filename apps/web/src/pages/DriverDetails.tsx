import {
  useQuery,
} from "@tanstack/react-query";

import {
  useParams,
  useNavigate,
} from "react-router-dom";


import {
  getDriver,
} from "../api/driver.api";



export default function DriverDetails(){


const {
 id,

} =
useParams();



const navigate =
useNavigate();




const {
 data:driver,
 isLoading,

}
=
useQuery({

queryKey:[
 "driver",
 id
],

queryFn:
()=>getDriver(id!),


enabled:
!!id,


});





if(isLoading){

return (

<div className="p-6">

Loading driver...

</div>

);

}





if(!driver){

return (

<div className="p-6">

Driver not found.

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







{/* PROFILE */}


<div
className="
rounded-xl
bg-white
p-6
shadow-sm
"
>


<h1 className="text-3xl font-bold">

{
driver.user?.displayName
}

</h1>


<p className="text-gray-500">

Username:

{
driver.user?.username
}

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

{
driver.isActive
?
"ACTIVE"
:
"INACTIVE"
}

</span>


</div>









{/* DRIVER INFO */}


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

License Information

</h2>


<p>

License:

<strong>

{
driver.licenseNumber
}

</strong>

</p>


<p>

Expiry:

<strong>

{
new Date(
driver.licenseExpiry
)
.toLocaleDateString()

}

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

Emergency Contact

</h2>


<p>

{
driver.emergencyContact
}

</p>


<p className="text-gray-500">

{
driver.emergencyPhone
}

</p>


</div>




</div>








{/* VEHICLE */}


<div
className="
rounded-xl
bg-white
p-6
shadow-sm
"
>


<h2 className="mb-4 text-xl font-bold">

Assigned Vehicle

</h2>



{
driver.vehicle
?

<div>


<p>

Plate:

<strong>

{
driver.vehicle.plateNumber
}

</strong>

</p>


<p>

Vehicle:

{
driver.vehicle.make
}
{" "}
{
driver.vehicle.model
}

</p>


<p>

Seats:

{
driver.vehicle.seatCapacity
}

</p>


</div>


:

<p className="text-gray-500">

No assigned vehicle.

</p>

}



</div>










{/* TRIPS */}


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
driver.trips?.length

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
driver.trips.map(
(trip:any)=>(


<tr
key={trip.id}
className="border-b"
>


<td className="p-3">

{
trip.tripNumber
}

</td>


<td className="p-3">

{
trip.status
}

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


)

)

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