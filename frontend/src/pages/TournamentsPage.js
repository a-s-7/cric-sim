import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function TournamentsPage() {
    const navigate = useNavigate();

    // const [wtcs, setWtcs] = useState([]);
    const [tournaments, setTournaments] = useState({ grouped: false, tournaments: [] });
    const [activeView, setActiveView] = useState(0);

    const views = ["All", "Events", "Leagues"];

    const fetchTournaments = async () => {
        let url = '/tournaments';
        const params = new URLSearchParams();
        params.set("grouped", "false");
        params.set("category", "all");

        try {
            const response = await fetch(url + "?" + params.toString());
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTournaments(result);
            console.log(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // const fetchWtcs = async () => {
    //     let url = '/wtc/info';

    //     try {
    //         const response = await fetch(url);
    //         if (!response.ok) {
    //             throw new Error("Response was not ok");
    //         }
    //         const result = await response.json();
    //         setWtcs(result);
    //         console.log(result);
    //     } catch (error) {
    //         console.error("Error fetching data:", error);
    //     }
    // };

    const updateTournaments = async (index) => {
        setActiveView(index);

        let url = '/tournaments';
        const params = new URLSearchParams();
        params.set("grouped", "false");

        if (index === 0) {
            params.set("category", "all");
        } else if (index === 1) {
            params.set("category", "international");
        } else if (index === 2) {
            params.set("category", "franchise");
        }

        try {
            const response = await fetch(url + "?" + params.toString());
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTournaments(result);
            console.log(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchTournaments();
        // fetchWtcs();
    }, []);

    return (
        <div className="min-h-screen p-4 bg-gray-50 font-['Reem_Kufi_Fun']">
            <div className="space-y-4">
                <div className="flex items-center justify-center h-16">
                    <div className="relative flex rounded-full w-[400px] border border-gray-200 shadow-inner bg-gray-100/50 h-12 p-1 items-center">
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
                                onClick={() => updateTournaments(index)}
                                className={`relative z-10 flex-1 h-full text-[13px] font-bold uppercase tracking-widest transition-colors duration-300 ${activeView === index
                                    ? "text-white"
                                    : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-full grid grid-cols-9 gap-5">
                    {!tournaments["grouped"] &&
                        tournaments["tournaments"].map((tournament, index) => (
                            <div
                                onClick={() => navigate("/tournaments/" + tournament.name + "-" + tournament.edition)}
                                key={tournament.id + "-" + index}
                                className="rounded-3xl border border-gray-300 
                 shadow-lg shadow-gray-400 hover:shadow-xl hover:shadow-gray-500
                 hover:scale-105 transition-all duration-300 
                 cursor-pointer w-full aspect-square flex items-center justify-center relative"
                                style={{ backgroundColor: tournament.tileBackgroundColor }}
                            >
                                <img
                                    src={tournament.mainLogo}
                                    alt={tournament.name}
                                    className={`${tournament.category === "franchise" ? "h-[55%] w-[55%]" : "h-[65%] w-[65%]"} object-contain`}
                                />
                                {tournament.category === "franchise" && <div className="absolute font-['Outfit'] bottom-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/20 text-white text-xs font-bold shadow-sm whitespace-nowrap">
                                    {tournament.edition}
                                </div>}
                            </div>
                        ))}
                </div>
                {/* {wtcs.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-black">
                            TEST
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {wtcs.map((wtc) => (
                                <div onClick={() => navigate("/" + wtc.acronym + "/" + wtc.edition)}
                                    key={wtc._id || wtc.edition}
                                    className="bg-black rounded-[36px] border border-gray-300 
                                    shadow-lg shadow-gray-400 hover:shadow-xl hover:shadow-gray-500
                                    hover:scale-105
                                    transition-all duration-300 
                                    cursor-pointer w-48 h-48 flex flex-col items-center justify-center relative">
                                    <img
                                        src={wtc.logo}
                                        alt={wtc.name}
                                        className="h-[65%] w-[65%] object-contain mb-2"
                                    />
                                    <div className="absolute font-['Outfit'] bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/20 text-white text-xs font-bold shadow-sm whitespace-nowrap">
                                        {wtc.edition}-{wtc.edition + 2}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )} */}
            </div>
        </div>
    );
}

export default TournamentsPage;
