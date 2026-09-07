import {
  useState,
} from "react";


import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";


import {
  createDispatcher,
} from "../api/dispatcher.api";



type Props = {

  open:boolean;

  onClose:()=>void;

};



const initialForm = {

  username:"",
  password:"",

  firstName:"",
  middleName:"",
  lastName:"",

  email:"",
  phone:"",

  terminalName:"",

};





export default function AddDispatcherModal({
  open,
  onClose,
}:Props){



const queryClient =
useQueryClient();



const [form,setForm] =
useState(initialForm);



const [error,setError] =
useState("");



const mutation =
useMutation({


mutationFn:createDispatcher,


onSuccess(){

queryClient.invalidateQueries({

queryKey:[
"dispatchers"
],

});


setForm(initialForm);

setError("");

onClose();


},



onError(error:any){

setError(

error?.response?.data?.message
||
"Failed to create dispatcher."

);

},


});






function update(
key:keyof typeof form,
value:string
){

setForm({

...form,

[key]:value

});

}






function submit(){


setError("");



if(
!form.username ||
!form.password ||
!form.firstName ||
!form.lastName ||
!form.terminalName
){

setError(
"Please complete all required fields."
);

return;

}



mutation.mutate(form);



}






if(!open){

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
max-w-xl
rounded-xl
bg-white
p-6
shadow-xl
"

>




<div

className="
mb-5
flex
justify-between
items-center
"

>

<h2 className="text-xl font-bold">

Add Dispatcher

</h2>



<button

onClick={onClose}

className="text-gray-500"

>

✕

</button>


</div>





{
error &&

<div

className="
mb-4
rounded-lg
bg-red-100
p-3
text-sm
text-red-700
"

>

{error}

</div>

}







<div

className="
grid
gap-4
md:grid-cols-2
"

>



{
Object.entries(form).map(

([key,value])=>(


<input


key={key}


type={
key==="password"
?
"password"
:
key==="email"
?
"email"
:
"text"
}


placeholder={
key
.replace(
/([A-Z])/g,
" $1"
)
}


value={value}


onChange={
e=>
update(
key as keyof typeof form,
e.target.value
)
}


className="
rounded-lg
border
p-3
"


/>


)

)

}



</div>








<div

className="
mt-6
flex
justify-end
gap-3
"

>



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

onClick={submit}


className="
rounded-lg
bg-blue-600
px-4
py-2
text-white
disabled:opacity-50
"

>


{
mutation.isPending
?
"Saving..."
:
"Create Dispatcher"
}


</button>



</div>






</div>


</div>


);

}