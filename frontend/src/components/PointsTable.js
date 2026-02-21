import React from 'react';
import { faCaretUp, faCaretDown, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function PointsTable({ pointsTableTeamsData, headerColor, topQualifiers }) {
    const getDiffDisplay = (diff) => {
        if (diff > 0) {
            return (
                <div className="mx-auto w-fit min-w-[36px] flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-transform group-hover:scale-105">
                    <FontAwesomeIcon icon={faCaretUp} size="sm" className="mr-1" />
                    <span className="font-bold text-[1.4vh] leading-none mt-[1px]">{diff}</span>
                </div>
            );
        } else if (diff < 0) {
            return (
                <div className="mx-auto w-fit min-w-[36px] flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-transform group-hover:scale-105">
                    <FontAwesomeIcon icon={faCaretDown} size="sm" className="mr-1" />
                    <span className="font-bold text-[1.4vh] leading-none mt-[1px]">{diff * -1}</span>
                </div>
            );
        } else {
            return (
                <div className="mx-auto w-fit min-w-[36px] flex flex-row items-center justify-center font-['Reem_Kufi_Fun'] px-1.5 py-0.5 rounded-md bg-zinc-50 text-zinc-400 border border-zinc-200/60 transition-transform group-hover:scale-105">
                    <FontAwesomeIcon icon={faMinus} size="xs" />
                </div>
            );
        }
    }

    return (
        <table className="w-full border-separate border-spacing-0 bg-white rounded-[10px] shadow-[0_4px_8px_rgba(0,0,0,0.2)] border border-zinc-200 overflow-hidden table-fixed">
            <thead style={{ background: headerColor }} className="font-['Reem_Kufi_Fun'] text-white text-center text-[1.5vh] whitespace-nowrap">
                <tr>
                    <th className="py-2 w-[60px]">POS</th>
                    <th className="py-2 w-[60px]"></th>
                    <th className="py-2 w-[240px] text-left">TEAM</th>
                    <th className="py-2 w-[60px]">GP</th>
                    <th className="py-2 w-[70px]">WON</th>
                    <th className="py-2 w-[70px]">LOST</th>
                    <th className="py-2 w-[60px]">NR</th>
                    <th className="py-2 w-[80px]">NRR</th>
                    <th className="py-2 w-[80px]">POINTS</th>
                    <th className="py-2 w-[110px]">FOR</th>
                    <th className="py-2 w-[110px]">AGAINST</th>
                </tr>
            </thead>
            <tbody className="font-['Nunito_Sans']">
                {pointsTableTeamsData.map((team, index) => {
                    const isTopQualifier = index < topQualifiers;
                    return (
                        <tr key={team.name} className={`${isTopQualifier ? 'bg-gray-100' : ''} group hover:bg-[#e4e4e4] transition-colors duration-200 text-sm`}>
                            <td
                                className="text-center py-3 px-2 border-b border-zinc-200 border-l-4 transition-colors font-['Reem_Kufi_Fun'] text-black text-[2.25vh]"
                                style={{
                                    borderLeftColor: isTopQualifier ? headerColor : 'transparent',
                                    fontWeight: isTopQualifier ? 'bold' : 'normal'
                                }}
                            >
                                {index + 1}.
                            </td>
                            <td className="text-center py-3 px-2 border-b border-zinc-200 italic">
                                {getDiffDisplay(team.diff)}
                            </td>
                            <td className="py-3 px-2 border-b border-zinc-200 font-['Reem_Kufi_Fun'] uppercase text-black whitespace-nowrap">
                                <div className="flex flex-row items-center">
                                    <img src={team.flag} alt={team.name + "Flag"} className="w-[3.5vh] mr-3 border border-zinc-200" style={{ filter: team.confirmed === false ? 'blur(2px)' : 'none' }} />
                                    {team.confirmed === false ? team.seed : team.name}
                                </div>
                            </td>
                            <td className="text-center py-3 px-2 border-b border-zinc-200">{team.played}</td>
                            <td className="text-center py-3 px-2 border-b border-zinc-200">{team.won}</td>
                            <td className="text-center py-3 px-2 border-b border-zinc-200">{team.lost}</td>
                            <td className="text-center py-3 px-2 border-b border-zinc-200">{team.noResult}</td>
                            <td className="text-center py-3 px-2 border-b border-zinc-200 font-['Reem_Kufi_Fun'] text-[1.8vh] font-bold text-black">{team.netRunRate > 0 ? "+" : ""}{team.netRunRate.toFixed(3)}</td>
                            <td className="text-center py-3 px-2 border-b border-zinc-200 font-['Reem_Kufi_Fun'] text-[1.8vh] font-bold text-black">{team.points}</td>
                            <td className="text-center py-4 px-4 border-b border-zinc-200 whitespace-nowrap">{team.runsScored + "/" + (Math.floor(team.ballsFaced / 6) + "." + (team.ballsFaced % 6))}</td>
                            <td className="text-center py-4 px-4 border-b border-zinc-200 whitespace-nowrap">{team.runsConceded + "/" + (Math.floor(team.ballsBowled / 6) + "." + (team.ballsBowled % 6))}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export default PointsTable;