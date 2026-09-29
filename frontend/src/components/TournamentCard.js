import { formatDateRange } from "./utils/dateUtils";
import { tournamentTileStyle } from "./utils/tileStyles";

function TournamentCard({ tournament, onClick }) {
    const tags = [tournament.status, tournament.format, tournament.division].filter(Boolean);
    return (
        <div
            onClick={onClick}
            className={`${tournamentTileStyle} col-span-3 grid grid-cols-subgrid overflow-hidden bg-white`}>
            {/* Left third: same size as one icon */}
            <div
                className="aspect-square flex items-center justify-center"
                style={{ backgroundColor: tournament.tileBackgroundColor }}
            >
                <img src={tournament.mainLogo} alt={tournament.name} className="h-[65%] w-[65%] object-contain" />
            </div>

            {/* Right two thirds: text, positioned so it can't change the height */}
            <div className="relative col-span-2 min-w-0">
                <div className="absolute inset-0 flex flex-col justify-center overflow-hidden pr-4">
                    <h3 className="truncate text-md font-semibold text-stone-800">{tournament.name}</h3>
                    <p className="truncate text-base text-stone-500">{tournament.edition}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium uppercase text-stone-600">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className="mt-2 truncate text-sm text-stone-400">
                        {formatDateRange(tournament.startDate, tournament.endDate)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TournamentCard;