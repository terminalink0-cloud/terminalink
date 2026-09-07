import { useAuth } from "../auth/AuthContext";


export default function Header() {

  const {
    logout,
  } = useAuth();


  return (
    <header
      className="
        flex
        h-16
        items-center
        justify-between
        border-b
        bg-white
        px-6
      "
    >

      <div>

        <h2
          className="
            text-lg
            font-semibold
            text-gray-900
          "
        >
          Admin Dashboard
        </h2>

      </div>


      <div
        className="
          flex
          items-center
          gap-4
        "
      >

        <span
          className="
            text-sm
            text-gray-500
          "
        >
          Terminalink Admin
        </span>


        <button
          onClick={logout}
          className="
            rounded-lg
            bg-red-500
            px-4
            py-2
            text-sm
            font-medium
            text-white
            hover:bg-red-600
          "
        >
          Logout
        </button>


      </div>


    </header>
  );
}