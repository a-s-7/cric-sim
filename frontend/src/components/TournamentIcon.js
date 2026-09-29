function TournamentIcon({ tournament, onClick }) {
    const isFranchise = tournament.category === "franchise";
    return (
        <div
            onClick={onClick}
            className="rounded-3xl ring-1 ring-gray-300 shadow-lg shadow-gray-300 hover:shadow-xl hover:shadow-gray-500 hover:scale-105 transition-all duration-300 cursor-pointer w-full aspect-square flex items-center justify-center relative shrink-0" style={{ backgroundColor: tournament.tileBackgroundColor }}
        >
            <img
                src={tournament.mainLogo}
                alt={tournament.name}
                className={"h-[65%] w-[65%] object-contain"}
            />
            {isFranchise && (
                <div className="absolute font-['Kanit'] bottom-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/20 text-white text-xs font-bold shadow-sm whitespace-nowrap">
                    {tournament.edition}
                </div>
            )}
        </div>
    );
}

export default TournamentIcon;