import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

function LeaguePage() {
    const [leagues, setLeagues] = useState([]);

    const fetchLeagues = async () => {
        let url = '/leagues/info';

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setLeagues(result);
            console.log(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchLeagues();
    }, []);

    return (
        <div className="leagueLandingPage">
            {leagues.map(league => (
                <NavLink to={"/" + league["acronym"] + "/" + league["edition"]}
                    key={league["acronym"] + "-" + league["edition"]}>
                    {league["name"] + " - " + league["edition"]}
                </NavLink>
            ))}
        </div>
    );
}

export default LeaguePage;