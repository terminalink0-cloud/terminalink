import {
  useEffect,
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


const emptyForm = {

  terminalName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",

};


// Fields that shouldn't be left blank when saving.
const requiredFields: (keyof typeof emptyForm)[] = [
  "terminalName",
  "firstName",
  "lastName",
];


function labelFor(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}



export default function EditDispatcherModal({

  open,
  dispatcher,
  onClose,

}:Props){



const queryClient =
useQueryClient();




const [form,setForm] =
useState(emptyForm);



const [error,setError] =
useState("");



// BUG FIX: this form used to be seeded only once via
// `useState(...)`'s initial value, which only runs on first
// mount. Since this modal component stays mounted between opens
// (it just returns null while closed), editing a different
// dispatcher after the first one kept showing the previous
// dispatcher's data. Resetting here whenever the target
// dispatcher (or the open/close state) changes fixes that, and
// also discards any unsaved edits left over from a cancelled
// previous session.
useEffect(()=>{

if(!dispatcher){

setForm(emptyForm);

return;

}


setForm({

terminalName:
dispatcher.terminalName ?? "",

firstName:
dispatcher.user?.firstName ?? "",

middleName:
dispatcher.user?.middleName ?? "",

lastName:
dispatcher.user?.lastName ?? "",

email:
dispatcher.user?.email ?? "",

phone:
dispatcher.user?.phone ?? "",

});


setError("");


// eslint-disable-next-line react-hooks/exhaustive-deps
},[dispatcher?.id, open]);







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


onError(error:any){

setError(

error?.response?.data?.message
||
"Failed to update dispatcher."

);

},


});



function update(
key:keyof typeof form,
value:string,
){

setForm({

...form,

[key]:value,

});

}



function submit(){

setError("");


if(
!form.terminalName ||
!form.firstName ||
!form.lastName
){

setError(
"Please complete all required fields."
);

return;

}


mutation.mutate();

}







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
p-4
"

>



<div

className="
flex
max-h-[90dvh]
w-full
max-w-lg
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

Edit Dispatcher

</h2>


<button

onClick={onClose}

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
space-y-4
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



{
(Object.keys(emptyForm) as (keyof typeof emptyForm)[]).map(

(key)=>{

const label =
labelFor(key);

const isRequired =
requiredFields.includes(key);

return (

<div

key={key}

className="flex flex-col gap-1"

>

<label

htmlFor={`edit-dispatcher-${key}`}

className="text-sm font-medium text-gray-700 dark:text-slate-300"

>

{label}

{
isRequired &&

<span className="text-red-600 dark:text-red-400"> *</span>

}

</label>


<input

id={`edit-dispatcher-${key}`}

type={
key==="email"
?
"email"
:
"text"
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

placeholder={label}


value={
form[key]
}


onChange={e=>

update(
key,
e.target.value,
)

}


/>

</div>

);

},

)

}



</div>



<div className="
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
">


<button

onClick={onClose}

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
"Save Changes"
}


</button>



</div>






</div>


</div>


);

}
