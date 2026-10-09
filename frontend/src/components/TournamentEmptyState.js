import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox } from "@fortawesome/free-solid-svg-icons";

function TournamentEmptyState({hasSearchQuery, hasActiveControls, onClear}) {
    return (
        <div key="empty" className="animate-fadeIn w-full flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <FontAwesomeIcon icon={faInbox} className="text-2xl text-stone-400" />
            </div>
            <div className="space-y-1">
                <p className="text-base font-semibold text-stone-700">No tournaments found</p>
                <p className="text-sm text-stone-400">
                    {hasSearchQuery && hasActiveControls
                        ? "Try adjusting your search or filters"
                        : hasSearchQuery
                            ? "Try adjusting your search"
                            : hasActiveControls
                                ? "Try adjusting your filters"
                                : "Check back soon"}
                </p>
            </div>
            {(hasActiveControls || hasSearchQuery) && (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-stone-800 active:scale-95"
                >
                    {hasActiveControls && hasSearchQuery ? "Clear search and filters" : hasActiveControls ? "Clear filters" : "Clear search"}
                </button>
            )}
        </div>
    )
}

export default TournamentEmptyState; 
