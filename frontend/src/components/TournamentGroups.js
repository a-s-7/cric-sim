import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import TournamentIcon from "./TournamentIcon";
import TournamentCard from "./TournamentCard";

function TournamentGroups({ sortedGroups, toggleGroup, groupField, closedGroups, viewMode, handleTournamentClick }) {

    return (
        <div className="animate-fadeIn flex flex-col gap-4 pb-4">
            {sortedGroups.map(([group, groupedTournaments]) => (
                <div key={group}>
                    <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="group font-['Reem_Kufi'] m-4 mb-3 text-2xl flex font-medium items-center gap-2 text-black
                                        transition-transform duration-150 active:scale-[0.98]
                                        focus-visible:outline-none"
                    >
                        <h2 className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-200 [@media(hover:hover)]:group-hover:decoration-black">
                            {groupField === "all" ? "TOURNAMENTS" : group.toUpperCase()}
                        </h2>

                        <span className="font-['Nunito_Sans'] text-xl font-light text-black/50 transition-colors duration-200 [@media(hover:hover)]:group-hover:text-black">
                            ({groupedTournaments.length})
                        </span>

                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`text-xs text-stone-400 transition-all duration-200 [@media(hover:hover)]:group-hover:text-black ${closedGroups[group] ? "-rotate-90" : ""
                                }`}
                        />
                    </button>

                    <div
                        className={`px-4 grid transition-[grid-template-rows] ease-in-out ${closedGroups[group]
                            ? "grid-rows-[0fr] duration-300 delay-[150ms] pointer-events-none"
                            : "grid-rows-[1fr] duration-300 delay-0 pointer-events-auto"
                            }`}
                    >
                        <div className="min-h-0 overflow-visible">
                            <div
                                className={`transition-[transform,opacity] ease-out ${closedGroups[group]
                                    ? "translate-y-2 opacity-0 duration-200 delay-0"
                                    : "translate-y-0 opacity-100 duration-250 delay-[220ms]"
                                    }`}
                            >
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,130px),1fr))] sm:grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] justify-start gap-5">
                                    {groupedTournaments.map((tournament, index) => {
                                        const Card = viewMode === "icon" ? TournamentIcon : TournamentCard;
                                        return (
                                            <Card
                                                key={tournament["baseId"] + "-" + index}
                                                tournament={tournament}
                                                onClick={() => handleTournamentClick(tournament)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TournamentGroups;
