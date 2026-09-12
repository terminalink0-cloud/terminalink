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



// CHANGED: sessionStorage instead of localStorage.
//
// localStorage is shared across every tab/window for the same
// origin, so opening a new tab (or reopening a closed one)
// picked up the existing session instead of showing the login
// form. sessionStorage is scoped to a single tab - a new tab
// starts empty, and closing a tab clears its sessionStorage
// entirely, which gives the "always back to login" behavior.
//
// Trade-off: refreshing the SAME tab still stays logged in
// (sessionStorage survives a reload), only NEW/closed tabs are
// affected. That matches what was asked for.
const [token,setToken] =
useState<string|null>(

  sessionStorage.getItem(
    "token"
  )

);





const [user,setUser] =
useState<User|null>(

  JSON.parse(
    sessionStorage.getItem(
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





sessionStorage.setItem(

"token",

accessToken

);





sessionStorage.setItem(

"user",

JSON.stringify(
loggedUser
)

);





sessionStorage.setItem(

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


sessionStorage.removeItem(
"token"
);


sessionStorage.removeItem(
"user"
);


sessionStorage.removeItem(
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
