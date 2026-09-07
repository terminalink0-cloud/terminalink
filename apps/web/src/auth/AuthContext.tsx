// src/auth/AuthContext.tsx

import {
  createContext,
  useContext,
  useState,
} from "react";



type User = {

  id:string;

  username:string;

  role:
  "ADMIN"
  |
  "DISPATCHER"
  |
  "DRIVER";

};



type AuthContextType = {

  token:string|null;

  user:User|null;

  role:string|null;

  authenticated:boolean;

  login:(data:any)=>void;

  logout:()=>void;

};



const AuthContext =
createContext<AuthContextType | null>(
  null
);





export function AuthProvider({

children

}:{

children:React.ReactNode;

}){



const [token,setToken] =
useState<string|null>(

  localStorage.getItem(
    "token"
  )

);





const [user,setUser] =
useState<User|null>(

  JSON.parse(
    localStorage.getItem(
      "user"
    )
    ||
    "null"
  )

);







function login(
data:any
){



const accessToken =
data.accessToken;



const loggedUser =
data.user;





localStorage.setItem(

"token",

accessToken

);





localStorage.setItem(

"user",

JSON.stringify(
loggedUser
)

);





localStorage.setItem(

"userRole",

loggedUser.role

);







setToken(
accessToken
);



setUser(
loggedUser
);



}









function logout(){


localStorage.removeItem(
"token"
);


localStorage.removeItem(
"user"
);


localStorage.removeItem(
"userRole"
);



setToken(null);


setUser(null);



}







return (

<AuthContext.Provider

value={{

token,

user,


role:
user?.role
??
null,


authenticated:
Boolean(token),



login,


logout,


}}

>


{children}


</AuthContext.Provider>


);


}








export function useAuth(){


const context =
useContext(
AuthContext
);



if(!context){

throw new Error(
"AuthContext must be used inside AuthProvider"
);

}



return context;



}