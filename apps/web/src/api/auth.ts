export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {

  accessToken:string;

  user:User;

}


export interface User {

  id:string;

  username:string;

  role:
  "ADMIN"
  |
  "DISPATCHER"
  |
  "DRIVER";

}

export interface User {
  id: string;
  username: string;
  role: string;
}
