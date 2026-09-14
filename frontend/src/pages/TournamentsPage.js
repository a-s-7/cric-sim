import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";
import { SearchBar } from "../components/SearchBar";

function TournamentsPage() {
    const navigate = useNavigate();

    const [tournaments, setTournaments] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedFormats, setSelectedFormats] = useState([]);

    const categoryMap = {
        events: "international",
        leagues: "franchise"
    };
    const categoryFrontendOptions = ["events", "leagues"];
    const formatOptions = ["T20", "ODI", "TEST", "HUNDRED"]
    const genderOptions = ["mens", "womens"];
    const statusOptions = ["upcoming", "active", "complete"];

    const TOURNAMENTS_URL = TOURNAMENT_ENDPOINTS.tournaments;

    const getStatusButtonStyle = (option, isSelected) => {
        if (!isSelected) {
            return 'text-neutral-500 hover:bg-neutral-100 hover:text-black';
        }

        if (option === 'UPCOMING') {
            return 'bg-black text-white font-semibold shadow-sm';
        }

        if (option === 'ACTIVE') {
            return 'bg-neutral-800 text-white font-semibold shadow-sm';
        }

        if (option === 'COMPLETE') {
            return 'bg-neutral-600 text-white font-semibold shadow-sm';
        }
    };

    const getFilteredTournaments = () => {
        return tournaments.filter((tournament) =>
            (selectedStatuses.length === 0 ||
                selectedStatuses.includes(tournament.status)) &&
            (selectedGenders.length === 0 ||
                selectedGenders.includes(tournament.division)) &&
            (selectedCategories.length === 0 ||
                selectedCategories.some(category => categoryMap[category] === tournament.category)) &&
            (selectedFormats.length === 0 ||
                selectedFormats.includes(tournament.format)));
    };

    const fetchTournaments = useCallback(async (viewIndex, genderIndex) => {
        try {
            const response = await fetch(TOURNAMENTS_URL);
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
            <div>
                {/* View + Search + Sorting Bar */}
                <div className="flex h-10 sm:h-12 md:h-14 items-center">
                    <div className="w-1/4 h-full ">LEFT</div>
                    <div className="w-1/2 h-full "><SearchBar /></div>
                    <div className="w-1/4 h-full">RIGHT</div>
                </div>
                <div className="flex h-8 sm:h-10 md:h-12 items-center bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="w-1/4 h-full flex flex-row items-center justify-center gap-1 px-1">
                        {statusOptions.map((option) => {
                            const isSelected = selectedStatuses.includes(option);

                            return (
                                <button
                                    key={option}
                                    onClick={() =>
                                        setSelectedStatuses((prev) =>
                                            isSelected
                                                ? prev.filter((item) => item !== option)
                                                : [...prev, option]
                                        )
                                    }
                                    className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                >
                                    {option.toUpperCase()}
                                </button>
                            );
                        })}
                    </div>
                    <div className="h-3/4 border-l border-gray-200" />
                    <div className="w-1/2 h-full flex items-center justify-center">
                        {genderOptions.map((option) => {
                            const isSelected = selectedGenders.includes(option);

                            return (
                                <button
                                    key={option}
                                    onClick={() =>
                                        setSelectedGenders((prev) =>
                                            isSelected
                                                ? prev.filter((item) => item !== option)
                                                : [...prev, option]
                                        )
                                    }
                                    className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                >
                                    {option.toUpperCase()}
                                </button>
                            );
                        })}
                                            <div className="h-3/4 border-l border-gray-200" />
  {formatOptions.map((option) => {
                            const isSelected = selectedFormats.includes(option);

                            return (
                                <button
                                    key={option}
                                    onClick={() =>
                                        setSelectedFormats((prev) =>
                                            isSelected
                                                ? prev.filter((item) => item !== option)
                                                : [...prev, option]
                                        )
                                    }
                                    className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                >
                                    {option.toUpperCase()}
                                </button>
                            );
                        })}
                       
                                            <div className="h-3/4 border-l border-gray-200" />


  {categoryFrontendOptions.map((option) => {
                            const isSelected = selectedCategories.includes(option);

                            return (
                                <button
                                    key={option}
                                    onClick={() =>
                                        setSelectedCategories((prev) =>
                                            isSelected
                                                ? prev.filter((item) => item !== option)
                                                : [...prev, option]
                                        )
                                    }
                                    className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                >
                                    {option.toUpperCase()}
                                </button>
                            );
                        })}

                      
                    </div>
                    <div className="h-3/4 border-l border-gray-200" />
                    <div className="w-1/4 h-full flex items-center justify-center">RIGHT</div>
                </div>
            </div>


            <div className="w-full grid grid-cols-9 gap-5 py-4">
                {getFilteredTournaments().map((tournament, index) => (
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
    );
}

export default TournamentsPage;
