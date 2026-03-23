import React from "react";
import { NavLink, useLocation } from "react-router-dom";

function NavBar() {
    const location = useLocation();
    const path = location.pathname;

    return (
        <div className="flex justify-between items-center h-[7%] font-['Nunito_Sans',_sans-serif] font-normal bg-[#f5f5f5] relative">
            <div className="p-[10px] flex flex-row items-center h-full">
                <NavLink to="/" className="text-[3vw] text-black font-['Reem_Kufi_Fun',_sans-serif] no-underline">
                    CRIC SIM
                </NavLink>
            </div>
            <div className="flex flex-row justify-center absolute left-1/2 -translate-x-1/2 h-full p-[10px] gap-[10px]">
                <NavLink
                    to="/leagues"
                    className={`flex items-center text-black font-['Reem_Kufi_Fun',_sans-serif] no-underline p-[10px] text-[1.75vh] hover:text-gray-500 ${path === "/leagues" ? "border-b border-black" : "border-b border-transparent"
                        }`}
                >
                    LEAGUES
                </NavLink>
                <NavLink
                    to="/events"
                    className={`flex items-center text-black font-['Reem_Kufi_Fun',_sans-serif] no-underline p-[10px] text-[1.75vh] hover:text-gray-500 ${path === "/events" ? "border-b border-black" : "border-b border-transparent"
                        }`}
                >
                    EVENTS
                </NavLink>
                <NavLink
                    to="/icc_events"
                    className={`flex items-center text-black font-['Reem_Kufi_Fun',_sans-serif] no-underline p-[10px] text-[1.75vh] hover:text-gray-500 ${path === "/icc_events" ? "border-b border-black" : "border-b border-transparent"
                        }`}
                >
                    ICC EVENTS
                </NavLink>
            </div>
        </div>
    );
}

export default NavBar;