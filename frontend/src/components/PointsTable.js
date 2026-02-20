import React from 'react';
import { faCaretUp, faCaretDown, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function PointsTable({ pointsTableTeamsData, headerColor, topQualifiers }) {
    const getDiffDisplay = (diff) => {
        if (diff > 0) {
            return <div className="w-full h-full flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] p-1">
                <FontAwesomeIcon icon={faCaretUp} size="lg" color="green" style={{ marginRight: '5px' }} />
                {diff}
            </div>
        } else if (diff < 0) {
            return <div className="w-full h-full flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] p-1">
                <FontAwesomeIcon icon={faCaretDown} size="lg" color="red" style={{ marginRight: '5px' }} />
                {diff * -1}
            </div>
        } else {
            return <div className="w-full h-full flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] p-1">
                <FontAwesomeIcon icon={faMinus} size="lg" color="black" />
            </div>
        }
    }

    return (
        <table className="w-full border-separate border-spacing-0 bg-white rounded-[10px] shadow-[0_4px_8px_rgba(0,0,0,0.2)] border border-zinc-200 overflow-hidden table-fixed">
            <thead style={{ background: headerColor }} className="font-['Reem_Kufi_Fun'] text-white text-center text-[1.5vh] whitespace-nowrap">
                <tr>
                    <th className="py-2 w-[60px]">POS</th>
                    <th className="py-2 w-[60px]"></th>
                    <th className="py-2 w-[240px] text-left">TEAM</th>
                    <th className="py-2 w-[80px]">NRR</th>
                    <th className="py-2 w-[80px]">POINTS</th>
                    <th className="py-2 w-[60px]">GP</th>
                    <th className="py-2 w-[70px]">WON</th>
                    <th className="py-2 w-[70px]">LOST</th>
                    <th className="py-2 w-[60px]">NR</th>
                    <th className="py-2 w-[110px]">FOR</th>
                    <th className="py-2 w-[110px]">AGAINST</th>
                </tr>
            </thead>
            <tbody className="font-['Nunito_Sans']">
                {pointsTableTeamsData.map((team, index) => (
                    <tr key={team.name} className={`${index < topQualifiers ? 'bg-gray-100' : ''} hover:bg-[#e4e4e4] transition-colors duration-200 text-sm`}>
                        <td className="text-center py-3 px-2 border-b border-zinc-200 font-['Reem_Kufi_Fun'] text-black text-[2.25vh]">{index + 1}.</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200 italic">
                            {getDiffDisplay(team.diff)}
                        </td>
                        <td className="py-3 px-2 border-b border-zinc-200 font-['Reem_Kufi_Fun'] uppercase text-black whitespace-nowrap">
                            <div className="flex flex-row items-center">
                                <img src={team.flag} alt={team.name + "Flag"} className="w-[3.5vh] mr-3 border border-zinc-200" style={{ filter: team.confirmed === false ? 'blur(2px)' : 'none' }} />
                                {team.confirmed === false ? team.seed : team.name}
                            </div>
                        </td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.netRunRate.toFixed(3)}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200 font-bold">{team.points}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.played}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.won}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.lost}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.noResult}</td>
                        <td className="text-center py-4 px-4 border-b border-zinc-200 whitespace-nowrap">{team.runsScored + "/" + (Math.floor(team.ballsFaced / 6) + "." + (team.ballsFaced % 6))}</td>
                        <td className="text-center py-4 px-4 border-b border-zinc-200 whitespace-nowrap">{team.runsConceded + "/" + (Math.floor(team.ballsBowled / 6) + "." + (team.ballsBowled % 6))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default PointsTable;