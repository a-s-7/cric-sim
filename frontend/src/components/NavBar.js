import { NavLink, useLocation } from "react-router-dom";

function NavBar() {
    const location = useLocation();
    const path = location.pathname;

    return (
        <div className="flex justify-between items-center h-[7%] font-['Reem_Kufi',_sans-serif] relative">
            <div className="p-[10px] flex flex-row items-center h-full">
                <NavLink to="/" className="text-[2.75vw] no-underline flex items-center">
                    <span className="font-bold text-black">CRIC</span>
                    <span className="font-normal text-black">SIM</span>
                </NavLink>
            </div>
          <div className="flex flex-row justify-center absolute left-1/2 -translate-x-1/2 h-full p-[10px] gap-[10px]">
    <NavLink
        to="/tournaments"
        className={`flex items-center no-underline p-[10px] text-[1.75vh] font-medium transition-colors duration-300 ease-in-out ${
            path === "/tournaments"
                ? "text-black"
                : "text-gray-400 hover:text-gray-800"
        }`}
    >
        TOURNAMENTS
    </NavLink>
</div>
        </div>
    );
}

export default NavBar;