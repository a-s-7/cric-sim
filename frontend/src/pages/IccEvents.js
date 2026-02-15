import React, { useEffect, useState } from "react";

function IccEvents() {

    const [tournaments, setTournaments] = useState([]);

    const colors = {
        "darkblue": "blue"
    }

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

    useEffect(() => {
        fetchTournaments();
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
                                <div
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
            </div>
        </div>
    );
}

export default IccEvents;
