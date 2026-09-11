import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";
import { SearchBar } from "../components/SearchBar";

function TournamentsPage() {
    const navigate = useNavigate();

    const [tournaments, setTournaments] = useState({ grouped: false, tournaments: [] });
    const [selected, setSelected] = useState(['Active']);

    const [activeView, setActiveView] = useState(0);
    const [activeGender, setActiveGender] = useState(0);

    const views = ["All", "Events", "Leagues"];
    const genders = ["All", "Mens", "Womens"];

    const TOURNAMENTS_URL = TOURNAMENT_ENDPOINTS.tournaments;

    const fetchTournaments = useCallback(async (viewIndex, genderIndex) => {
        setActiveView(viewIndex);
        setActiveGender(genderIndex);

        const params = new URLSearchParams();
        params.set("grouped", "false");

        if (viewIndex === 0) {
            params.set("category", "all");
        } else if (viewIndex === 1) {
            params.set("category", "international");
        } else {
            params.set("category", "franchise");
        }

        if (genderIndex === 0) {
            params.set("division", "all");
        } else if (genderIndex === 1) {
            params.set("division", "mens");
        } else {
            params.set("division", "womens");
        }

        try {
            const response = await fetch(`${TOURNAMENTS_URL}?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTournaments(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, [TOURNAMENTS_URL]);

    useEffect(() => {
        fetchTournaments(0, 0);
    }, [fetchTournaments]);

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-gray-50 font-['Reem_Kufi']">
            <div className="space-y-4">
                {/* <div className="relative items-center h-16">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex rounded-full w-[400px] border border-gray-200 shadow-inner bg-gray-100/50 h-12 p-1 items-center ">
                        <div
                            className="absolute transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-full shadow-md"
                            style={{
                                width: `calc((100% - 8px) / 3)`,
                                left: `calc(4px + ${activeGender} * (100% - 8px) / 3)`,
                                height: 'calc(100% - 8px)',
                                background: 'black',
                            }}
                        />
                        {genders.map((gender, indexG) => (
                            <button
                                key={gender}
                                onClick={() => fetchTournaments(activeView, indexG)}
                                className={`relative z-10 flex-1 h-full text-[13px] font-bold uppercase tracking-widest transition-colors duration-300 ${activeGender === indexG
                                    ? "text-white"
                                    : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {gender}
                            </button>
                        ))}
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex rounded-full w-[400px] border border-gray-200 shadow-inner bg-gray-100/50 h-12 p-1 items-center ">
                        <div
                            className="absolute transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-full shadow-md"
                            style={{
                                width: `calc((100% - 8px) / 3)`,
                                left: `calc(4px + ${activeView} * (100% - 8px) / 3)`,
                                height: 'calc(100% - 8px)',
                                background: 'black',
                            }}
                        />
                        {views.map((view, index) => (
                            <button
                                key={view}
                                onClick={() => fetchTournaments(index, activeGender)}
                                className={`relative z-10 flex-1 h-full text-[13px] font-bold uppercase tracking-widest transition-colors duration-300 ${activeView === index
                                    ? "text-white"
                                    : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                </div> */}

                <div>
                    {/* View + Search + Sorting Bar */}
                    <div className="flex h-10 sm:h-12 md:h-14 items-center">
                        <div className="w-1/4 h-full ">LEFT</div>
                        <div className="w-1/2 h-full "><SearchBar /></div>
                        <div className="w-1/4 h-full">RIGHT</div>
                    </div>
                    <div className="flex h-8 sm:h-10 md:h-12 items-center bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="w-1/4 h-full flex flex-row items-center justify-center gap-1 px-1">
                            {['UPCOMING', 'ACTIVE', 'COMPLETE'].map((option) => {
                                const isSelected = selected.includes(option);

                              // True sequential linear gradient from solid black -> dark charcoal -> muted dark gray
            const styles = {
                UPCOMING: isSelected
                    ? 'bg-black text-white font-semibold shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-black',
                ACTIVE: isSelected
                    ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-black',
                COMPLETE: isSelected
                    ? 'bg-neutral-600 text-white font-semibold shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-black',
            };
                                return (
                                    <button
                                        key={option}
                                        onClick={() =>
                                            setSelected((prev) =>
                                                isSelected
                                                    ? prev.filter((item) => item !== option)
                                                    : [...prev, option]
                                            )
                                        }
                                        className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${styles[option]}`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="h-3/4 border-l border-gray-200" />
                        <div className="w-1/2 h-full flex items-center justify-center">CENTER</div>
                        <div className="h-3/4 border-l border-gray-200" />
                        <div className="w-1/4 h-full flex items-center justify-center">RIGHT</div>
                    </div>
                </div>


                <div className="w-full grid grid-cols-9 gap-5">
                    {!tournaments["grouped"] &&
                        tournaments["tournaments"].map((tournament, index) => (
                            <div
                                onClick={() => navigate("/tournaments/" + tournament["baseId"])}
                                key={tournament["baseId"] + "-" + index}
                                className="rounded-3xl border border-gray-300 
                                            shadow-lg shadow-gray-400 hover:shadow-xl hover:shadow-gray-500
                                            hover:scale-105 transition-all duration-300 
                                            cursor-pointer w-full aspect-square flex items-center justify-center relative"
                                style={{ backgroundColor: tournament["tileBackgroundColor"] }}
                            >
                                <img
                                    src={tournament["mainLogo"]}
                                    alt={tournament["name"]}
                                    className={`${tournament["category"] === "franchise" ? "h-[55%] w-[55%]" : "h-[65%] w-[65%]"} object-contain`}
                                />
                                {tournament["category"] === "franchise" && <div className="absolute font-['Outfit'] bottom-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/20 text-white text-xs font-bold shadow-sm whitespace-nowrap">
                                    {tournament["edition"]}
                                </div>}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default TournamentsPage;
