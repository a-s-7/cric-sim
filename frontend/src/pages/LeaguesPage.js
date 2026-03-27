import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function LeaguesPage() {
    const navigate = useNavigate();

    const [tournaments, setTournaments] = useState([]);

    const fetchFranchiseTournaments = async () => {
        let url = '/tournaments';
        const params = new URLSearchParams();
        params.set("category", "franchise");

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
        fetchFranchiseTournaments();
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
                                    className={`rounded-[36px] border border-gray-300 
                                    shadow-lg shadow-gray-400 hover:shadow-xl hover:shadow-gray-500
                                    hover:scale-105
                                    transition-all duration-300 
                                    relative
                                    cursor-pointer w-48 h-48 flex items-center justify-center`}
                                    style={{ backgroundColor: tournament.tileBackgroundColor }}>
                                    <img
                                        src={tournament.mainLogo}
                                        alt={tournament.name}
                                        className="h-[65%] w-[65%] object-contain"
                                    />
                                    <div className="absolute font-['Outfit'] bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/20 text-white text-xs font-bold shadow-sm whitespace-nowrap">
                                        {tournament.edition}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LeaguesPage;
