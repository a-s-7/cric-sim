import { faCaretUp, faCaretDown, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function StandingsMovementIndicator({ diff }) {
    if (diff > 0) {
        return (
            <div className="mx-auto w-fit min-w-[36px] flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <FontAwesomeIcon icon={faCaretUp} size="sm" className="mr-1" />
                <span className="font-bold text-[1.4vh] leading-none mt-[1px]">{diff}</span>
            </div>
        );
    }

    if (diff < 0) {
        return (
            <div className="mx-auto w-fit min-w-[36px] flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <FontAwesomeIcon icon={faCaretDown} size="sm" className="mr-1" />
                <span className="font-bold text-[1.4vh] leading-none mt-[1px]">{diff * -1}</span>
            </div>
        );
    }

    return (
        <div className="mx-auto w-fit min-w-[36px] flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] px-1.5 py-0.5 rounded-md bg-zinc-50 text-zinc-400 border border-zinc-200">
            <FontAwesomeIcon icon={faMinus} size="xs" />
        </div>
    );
}

export default StandingsMovementIndicator;
