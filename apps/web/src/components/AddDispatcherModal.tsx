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


// Fields the user must fill in before submitting. Anything not
// listed here (middleName, email, phone) is optional.
const requiredFields: (keyof typeof initialForm)[] = [
  "username",
  "password",
  "firstName",
  "lastName",
  "terminalName",
];


function labelFor(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}





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



function closeAndReset(){

setForm(initialForm);

setError("");

onClose();

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
p-4
"

>



<div

className="
flex
max-h-[90dvh]
w-full
max-w-xl
flex-col
rounded-xl
bg-white
shadow-xl
dark:bg-slate-900
"

>




<div

className="
flex
shrink-0
items-center
justify-between
border-b
border-gray-100
px-4
py-4
dark:border-slate-800
sm:px-6
"

>

<h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">

Add Dispatcher

</h2>



<button

onClick={closeAndReset}

aria-label="Close"

className="
-m-2
rounded-lg
p-2
text-gray-500
hover:bg-gray-100
dark:text-slate-400
dark:hover:bg-slate-800
"

>

✕

</button>


</div>



<div

className="
min-h-0
flex-1
overflow-y-auto
px-4
py-5
sm:px-6
"

>



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
dark:bg-red-950/40
dark:text-red-300
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

([key,value])=>{

const label =
labelFor(key);

const isRequired =
requiredFields.includes(
key as keyof typeof form,
);

return (

<div

key={key}

className="flex flex-col gap-1"

>

<label

htmlFor={`add-dispatcher-${key}`}

className="text-sm font-medium text-gray-700 dark:text-slate-300"

>

{label}

{
isRequired &&

<span className="text-red-600 dark:text-red-400"> *</span>

}

</label>

<input


id={`add-dispatcher-${key}`}


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


placeholder={label}


value={value}


onChange={
e=>
update(
key as keyof typeof form,
e.target.value
)
}


className="
w-full
rounded-lg
border
border-gray-300
bg-white
p-3
text-gray-900
placeholder:text-gray-400
dark:border-slate-700
dark:bg-slate-800
dark:text-white
dark:placeholder:text-slate-500
"


/>

</div>

);

}

)

}



</div>



</div>



<div

className="
flex
shrink-0
flex-col-reverse
gap-3
border-t
border-gray-100
px-4
py-4
dark:border-slate-800
sm:flex-row
sm:justify-end
sm:px-6
"

>



<button

onClick={closeAndReset}

className="
w-full
rounded-lg
border
border-gray-300
px-4
py-2
text-gray-700
hover:bg-gray-50
dark:border-slate-700
dark:text-slate-300
dark:hover:bg-slate-800
sm:w-auto
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
w-full
rounded-lg
bg-blue-600
px-4
py-2
text-white
hover:bg-blue-700
disabled:opacity-50
sm:w-auto
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
