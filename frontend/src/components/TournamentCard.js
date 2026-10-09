import { Fragment } from "react";
import { formatDateRange } from "./utils/dateUtils";
import { tournamentTileStyle } from "./utils/tileStyles";

const STATUS_STYLE = {
    active: { dot: "bg-emerald-500", text: "text-emerald-700" },
    upcoming: { dot: "bg-sky-500", text: "text-sky-700" },
    complete: { dot: "bg-stone-400", text: "text-stone-500" },
};

const DIVISION_LABEL = { mens: "Men's", womens: "Women's" };

function TournamentCard({ tournament, onClick }) {
    const status = STATUS_STYLE[tournament.status?.toLowerCase()] ?? STATUS_STYLE.complete;
    const division = DIVISION_LABEL[tournament.division?.toLowerCase()] ?? tournament.division;
    const meta = [tournament.edition, tournament.format, division].filter(Boolean);

    return (
        <div
            onClick={onClick}
            className={`${tournamentTileStyle} font-['Nunito_Sans'] col-span-3 grid grid-cols-subgrid overflow-hidden bg-white`}>
            <div
                className="aspect-square flex items-center justify-center border-r border-black/[0.02]"
                style={{ backgroundColor: tournament.tileBackgroundColor }}
            >
                <img src={tournament.mainLogo} alt={tournament.name} className="h-[65%] w-[65%] object-contain" />
            </div>

            <div className="relative col-span-2 min-w-0">
                <div className="absolute inset-0 flex flex-col justify-center overflow-hidden pr-4">
                    {/* Tier 1: status */}
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest ${status.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {tournament.status}
                        {tournament.isBeta && (
                            <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-amber-800">
                                BETA
                            </span>
                        )}
                    </div>

                    {/* Tier 2: identity */}
                    <h3 className="mt-1.5 truncate text-lg font-semibold leading-tight tracking-tight text-stone-900">
                        {tournament.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-stone-600">
                        {meta.map((item, i) => (
                            <Fragment key={`${item}-${i}`}>
                                {i > 0 && (
                                    <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-stone-400" />
                                )}
                                <span>{item}</span>
                            </Fragment>
                        ))}
                    </div>

                    {/* Tier 3: when */}
                    <p className="mt-3 truncate text-sm font-medium tabular-nums text-stone-800">
                        {formatDateRange(tournament.startDate, tournament.endDate)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TournamentCard;
