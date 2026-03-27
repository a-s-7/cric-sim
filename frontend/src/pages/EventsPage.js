import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function EventsPage() {
    const navigate = useNavigate();

    const [wtcs, setWtcs] = useState([]);
    const [tournaments, setTournaments] = useState([]);

    const fetchTournaments = async () => {
        let url = '/tournaments';

        try {
            const response = await fetch(url);
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

    const fetchWtcs = async () => {
        let url = '/wtc/info';

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setWtcs(result);
            console.log(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchTournaments();
        fetchWtcs();
    }, []);

    return (
        <div className="min-h-screen p-4 bg-gray-50 font-['Reem_Kufi_Fun']">
            <div className="space-y-4">
                {Object.entries(tournaments).map(([format, tournamentList]) => (
                    <div key={format} className="space-y-4">
                        <h2 className="text-3xl font-bold text-black">
                            {format}
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {tournamentList.map((tournament) => (
                                <div onClick={() => navigate("/tournaments/" + tournament.id)}
                                    key={tournament.id}
                                    className="bg-white rounded-3xl border border-gray-300 
                                    shadow-lg shadow-gray-400 hover:shadow-xl hover:shadow-gray-500
                                    hover:scale-105
                                    transition-all duration-300 
                                    cursor-pointer w-48 h-48 flex items-center justify-center">
                                    <img
                                        src={tournament.mainLogo}
                                        alt={tournament.name}
                                        className="h-[65%] w-[65%] object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {wtcs.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-black">
                            TEST
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {wtcs.map((wtc) => (
                                <div onClick={() => navigate("/" + wtc.acronym + "/" + wtc.edition)}
                                    key={wtc._id || wtc.edition}
                                    className="bg-black rounded-3xl border border-gray-300 
                                    shadow-lg shadow-gray-400 hover:shadow-xl hover:shadow-gray-500
                                    hover:scale-105
                                    transition-all duration-300 
                                    cursor-pointer w-48 h-48 flex flex-col items-center justify-center relative">
                                    <img
                                        src={wtc.logo}
                                        alt={wtc.name}
                                        className="h-[65%] w-[65%] object-contain mb-2"
                                    />
                                    <span className="absolute bottom-4 text-white font-semibold text-sm tracking-widest opacity-90">
                                        {wtc.edition}-{wtc.edition + 2}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventsPage;
