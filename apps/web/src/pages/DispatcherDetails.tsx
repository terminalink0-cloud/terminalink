import {
  useQuery,
} from "@tanstack/react-query";

import {
  useParams,
  useNavigate,
} from "react-router-dom";


import {
  getDispatcher,
} from "../api/dispatcher.api";



export default function DispatcherDetails(){


const {
 id,

} =
useParams();



const navigate =
useNavigate();




const {
 data:dispatcher,
 isLoading,

}
=
useQuery({

queryKey:[
 "dispatcher",
 id
],

queryFn:
()=>getDispatcher(id!),


enabled:
!!id,


});





if(isLoading){

return (

<div className="p-6">

Loading dispatcher...

</div>

);

}





if(!dispatcher){

return (

<div className="p-6">

Dispatcher not found.

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
dispatcher.user?.displayName
}

</h1>


<p className="text-gray-500">

Username:

{
dispatcher.user?.username
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
dispatcher.isActive
?
"ACTIVE"
:
"INACTIVE"
}

</span>


</div>









{/* TERMINAL + CONTACT INFO */}


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

Terminal Information

</h2>


<p>

Terminal:

<strong>

{
dispatcher.terminalName
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

Contact Information

</h2>


<p>

{
dispatcher.user?.email
??
"-"
}

</p>


<p className="text-gray-500">

{
dispatcher.user?.phone
??
"-"
}

</p>


</div>




</div>










{/* GATE EVENTS */}


<div
className="
rounded-xl
bg-white
p-6
shadow-sm
"
>


<h2 className="mb-4 text-xl font-bold">

Gate Event History

</h2>



{
dispatcher.gateEvents?.length

?

<table className="w-full text-left">


<thead>

<tr className="border-b text-gray-500">


<th className="p-3">
Type
</th>


<th className="p-3">
Trip
</th>


<th className="p-3">
Date
</th>


</tr>

</thead>



<tbody>


{
dispatcher.gateEvents.map(
(event:any)=>(


<tr
key={event.id}
className="border-b"
>


<td className="p-3">

{
event.type
??
event.eventType
??
"-"
}

</td>


<td className="p-3">

{
event.tripId
??
"-"
}

</td>


<td className="p-3">

{
new Date(
event.createdAt
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

No gate events found.

</p>

}



</div>




</div>

);

}