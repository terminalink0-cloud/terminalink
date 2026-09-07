import {
  useState,
} from "react";


import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";


import {
  updateDispatcher,
} from "../api/dispatcher.api";



type Props = {

  open:boolean;

  dispatcher:any;

  onClose:()=>void;

};



export default function EditDispatcherModal({

  open,
  dispatcher,
  onClose,

}:Props){



const queryClient =
useQueryClient();




const [form,setForm] =
useState({

terminalName:
dispatcher?.terminalName ?? "",

firstName:
dispatcher?.user?.firstName ?? "",

middleName:
dispatcher?.user?.middleName ?? "",

lastName:
dispatcher?.user?.lastName ?? "",

email:
dispatcher?.user?.email ?? "",

phone:
dispatcher?.user?.phone ?? "",

});







const mutation =
useMutation({


mutationFn:()=>


updateDispatcher(

dispatcher.id,

form

),



onSuccess(){


queryClient.invalidateQueries({

queryKey:[
"dispatchers"
]

});


onClose();


},



});







if(!open || !dispatcher){

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

Edit Dispatcher

</h2>






<input

className="
mb-3
w-full
rounded-lg
border
p-3
"

placeholder="Terminal Name"


value={
form.terminalName
}


onChange={e=>

setForm({

...form,

terminalName:
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

placeholder="First Name"


value={
form.firstName
}


onChange={e=>

setForm({

...form,

firstName:
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

placeholder="Middle Name"


value={
form.middleName
}


onChange={e=>

setForm({

...form,

middleName:
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

placeholder="Last Name"


value={
form.lastName
}


onChange={e=>

setForm({

...form,

lastName:
e.target.value

})

}


/>







<input

type="email"

className="
mb-3
w-full
rounded-lg
border
p-3
"

placeholder="Email"


value={
form.email
}


onChange={e=>

setForm({

...form,

email:
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

placeholder="Phone"


value={
form.phone
}


onChange={e=>

setForm({

...form,

phone:
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