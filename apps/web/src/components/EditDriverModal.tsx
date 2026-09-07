import {
  useState,
} from "react";


import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";


import {
  updateDriver,
} from "../api/driver.api";



type Props = {

  open:boolean;

  driver:any;

  onClose:()=>void;

};



export default function EditDriverModal({

  open,
  driver,
  onClose,

}:Props){



const queryClient =
useQueryClient();




const [form,setForm] =
useState({

licenseNumber:
driver?.licenseNumber ?? "",

licenseExpiry:
driver?.licenseExpiry
?
driver.licenseExpiry.substring(0,10)
:
"",

emergencyContact:
driver?.emergencyContact ?? "",

emergencyPhone:
driver?.emergencyPhone ?? "",

});







const mutation =
useMutation({


mutationFn:()=>


updateDriver(

driver.id,

form

),



onSuccess(){


queryClient.invalidateQueries({

queryKey:[
"drivers"
]

});


onClose();


},



});







if(!open || !driver){

return null;

}







return (


<div

className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/40
"

>



<div

className="
w-full
max-w-lg
rounded-xl
bg-white
p-6
shadow-xl
"

>




<h2 className="mb-5 text-xl font-bold">

Edit Driver

</h2>






<input

className="
mb-3
w-full
rounded-lg
border
p-3
"

placeholder="License Number"


value={
form.licenseNumber
}


onChange={e=>

setForm({

...form,

licenseNumber:
e.target.value

})

}


/>







<input

type="date"

className="
mb-3
w-full
rounded-lg
border
p-3
"

value={
form.licenseExpiry
}


onChange={e=>

setForm({

...form,

licenseExpiry:
e.target.value

})

}


/>







<input

className="
mb-3
w-full
rounded-lg
border
p-3
"

placeholder="Emergency Contact"


value={
form.emergencyContact
}


onChange={e=>

setForm({

...form,

emergencyContact:
e.target.value

})

}


/>








<input

className="
mb-3
w-full
rounded-lg
border
p-3
"

placeholder="Emergency Phone"


value={
form.emergencyPhone
}


onChange={e=>

setForm({

...form,

emergencyPhone:
e.target.value

})

}


/>







<div className="mt-5 flex justify-end gap-3">


<button

onClick={onClose}

className="
rounded-lg
border
px-4
py-2
"

>

Cancel

</button>





<button

disabled={
mutation.isPending
}


onClick={()=>
mutation.mutate()
}


className="
rounded-lg
bg-blue-600
px-4
py-2
text-white
"

>


{
mutation.isPending
?
"Saving..."
:
"Save Changes"
}


</button>



</div>






</div>


</div>


);

}