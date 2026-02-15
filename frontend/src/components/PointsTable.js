import React from 'react';
import { faCaretUp, faCaretDown, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function PointsTable({ pointsTableData, headerColor }) {
    const check = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExIDNDMTUuNDE4MyAzIDE5IDYuNTgxNzIgMTkgMTFDMTkgMTUuNDE4MyAxNS40MTgzIDE5IDExIDE5QzYuNTgxNzIgMTkgMyAxNS40MTgzIDMgMTFDMyA2LjU4MTcyIDYuNTgxNzIgMyAxMSAzWiIgZmlsbD0iIzM0QTg1MyIvPgo8cGF0aCBkPSJNOS4yIDEyLjI4TDcuMTIgMTAuMkw2IDExLjMyTDkuMiAxNC41MkwxNS42IDguMTJMMTQuNDggN0w5LjIgMTIuMjhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";
    const dash = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMSAxOUMxNS40MTgzIDE5IDE5IDE1LjQxODMgMTkgMTFDMTkgNi41ODE3MiAxNS40MTgzIDMgMTEgM0M2LjU4MTcyIDMgMyA2LjU4MTcyIDMgMTFDMyAxNS40MTgzIDYuNTgxNzIgMTkgMTEgMTlaIiBmaWxsPSIjOUQ5QkE3Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOCAxMEgxNFYxMkg4VjEwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";
    const cross = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExIDNDMTUuNDE4MyAzIDE5IDYuNTgxNzIgMTkgMTFDMTkgMTUuNDE4MyAxNS40MTgzIDE5IDExIDE5QzYuNTgxNzIgMTkgMyAxNS40MTgzIDMgMTFDMyA2LjU4MTcyIDYuNTgxNzIgMyAxMSAzWiIgZmlsbD0iI0VBNDMzNSIvPgo8cGF0aCBkPSJNOS4yIDEyLjI4TDcuMTIgMTAuMkw2IDExLjMyTDkuMiAxNC41MkwxNS42IDguMTJMMTQuNDggN0w5LjIgMTIuMjhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTExIDE5QzE1LjQxODMgMTkgMTkgMTUuNDE4MyAxOSAxMUMxOSA2LjU4MTcyIDE1LjQxODMgMyAxMSAzQzYuNTgxNzIgMyAzIDYuNTgxNzIgMyAxMUMzIDE1LjQxODMgNi41ODE3MiAxOSAxMSAxOVoiIGZpbGw9IiNFQTQzMzUiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMy4yNjI3IDE0LjM5NDFMMTEgMTIuMTMxNEw4LjczNzI2IDE0LjM5NDFMNy42MDU4OSAxMy4yNjI3TDkuODY4NjMgMTFMNy42MDU4OSA4LjczNzI1TDguNzM3MjYgNy42MDU4OEwxMSA5Ljg2ODYyTDEzLjI2MjcgNy42MDU4OEwxNC4zOTQxIDguNzM3MjVMMTIuMTMxNCAxMUwxNC4zOTQxIDEzLjI2MjdMMTMuMjYyNyAxNC4zOTQxWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";

    const bigDash = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExIDBDNC45MjQ4NyAwIDAgNC45MjQ4NyAwIDExQzAgMTcuMDc1MSA0LjkyNDg3IDIyIDExIDIyQzE3LjA3NTEgMjIgMjIgMTcuMDc1MSAyMiAxMUMyMiA0LjkyNDg3IDE3LjA3NTEgMCAxMSAwWiIgZmlsbD0iIzlEOUJBNyIvPgo8cGF0aCBkPSJNMTEgMkM2LjAyOTQ0IDIgMiA2LjAyOTQ0IDIgMTFDMiAxNS45NzA2IDYuMDI5NDQgMjAgMTEgMjBDMTUuOTcwNiAyMCAyMCAxNS45NzA2IDIwIDExQzIwIDYuMDI5NDQgMTUuOTcwNiAyIDExIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTExIDE5QzE1LjQxODMgMTkgMTkgMTUuNDE4MyAxOSAxMUMxOSA2LjU4MTcyIDE1LjQxODMgMyAxMSAzQzYuNTgxNzIgMyAzIDYuNTgxNzIgMyAxMUMzIDE1LjQxODMgNi41ODE3MiAxOSAxMSAxOVoiIGZpbGw9IiM5RDlCQTciLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDEwSDE0VjEySDhWMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";
    const bigCheck = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExIDBDNC45MjQ4NyAwIDAgNC45MjQ4NyAwIDExQzAgMTcuMDc1MSA0LjkyNDg3IDIyIDExIDIyQzE3LjA3NTEgMjIgMjIgMTcuMDc1MSAyMiAxMUMyMiA0LjkyNDg3IDE3LjA3NTEgMCAxMSAwWiIgZmlsbD0iIzM0QTg1MyIvPgo8cGF0aCBkPSJNMTEgMkM2LjAyOTQ0IDIgMiA2LjAyOTQ0IDIgMTFDMiAxNS45NzA2IDYuMDI5NDQgMjAgMTEgMjBDMTUuOTcwNiAyMCAyMCAxNS45NzA2IDIwIDExQzIwIDYuMDI5NDQgMTUuOTcwNiAyIDExIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEgM0MxNS40MTgzIDMgMTkgNi41ODE3MiAxOSAxMUMxOSAxNS40MTgzIDE1LjQxODMgMTkgMTEgMTlDNi41ODE3MiAxOSAzIDE1LjQxODMgMyAxMUMzIDYuNTgxNzIgNi41ODE3MiAzIDExIDNaIiBmaWxsPSIjMzRBODUzIi8+CjxwYXRoIGQ9Ik05LjIgMTIuMjhMNy4xMiAxMC4yTDYgMTEuMzJMOS4yIDE0LjUyTDE1LjYgOC4xMkwxNC40OCA3TDkuMiAxMi4yOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=";
    const bigCross = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExIDNDMTUuNDE4MyAzIDE5IDYuNTgxNzIgMTkgMTFDMTkgMTUuNDE4MyAxNS40MTgzIDE5IDExIDE5QzYuNTgxNzIgMTkgMyAxNS40MTgzIDMgMTFDMyA2LjU4MTcyIDYuNTgxNzIgMyAxMSAzWiIgZmlsbD0iI0VBNDMzNSIvPgo8cGF0aCBkPSJNOS4yIDEyLjI4TDcuMTIgMTAuMkw2IDExLjMyTDkuMiAxNC41MkwxNS42IDguMTJMMTQuNDggN0w5LjIgMTIuMjhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEgMEM0LjkyNDg3IDAgMCA0LjkyNDg3IDAgMTFDMCAxNy4wNzUxIDQuOTI0ODcgMjIgMTEgMjJDMTcuMDc1MSAyMiAyMiAxNy4wNzUxIDIyIDExQzIyIDQuOTI0ODcgMTcuMDc1MSAwIDExIDBaIiBmaWxsPSIjRUE0MzM1Ii8+CjxwYXRoIGQ9Ik0xMSAyQzYuMDI5NDQgMiAyIDYuMDI5NDQgMiAxMUMyIDE1Ljk3MDYgNi4wMjk0NCAyMCAxMSAyMEMxNS45NzA2IDIwIDIwIDE1Ljk3MDYgMjAgMTFDMjAgNi4wMjk0NCAxNS45NzA2IDIgMTEgMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTEgMTlDMTUuNDE4MyAxOSAxOSAxNS40MTgzIDE5IDExQzE5IDYuNTgxNzIgMTUuNDE4MyAzIDExIDNDNi41ODE3MiAzIDMgNi41ODE3MiAzIDExQzMgMTUuNDE4MyA2LjU4MTcyIDE5IDExIDE5WiIgZmlsbD0iI0VBNDMzNSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjI2MjcgMTQuMzk0MUwxMSAxMi4xMzE0TDguNzM3MjYgMTQuMzk0MUw3LjYwNTg5IDEzLjI2MjdMOS44Njg2MyAxMUw3LjYwNTg5IDguNzM3MjVMOC43MzcyNiA3LjYwNTg4TDExIDkuODY4NjJMMTMuMjYyNyA3LjYwNTg4TDE0LjM5NDEgOC43MzcyNUwxMi4xMzE0IDExTDE0LjM5NDEgMTMuMjYyN0wxMy4yNjI3IDE0LjM5NDFaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";

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
                    <th className="py-2 w-[90px]">PLAYED</th>
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
                {pointsTableData.map((team, index) => (
                    <tr key={team.name} className="hover:bg-[#e4e4e4] transition-colors duration-200 text-sm">
                        <td className="text-center py-3 px-2 border-b border-zinc-200 font-['Reem_Kufi_Fun'] text-black">{index + 1}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200 italic">
                            {getDiffDisplay(team.diff)}
                        </td>
                        <td className="py-3 px-2 border-b border-zinc-200 font-['Reem_Kufi_Fun'] uppercase text-black whitespace-nowrap">
                            <div className="flex flex-row items-center">
                                <img src={team.flag} alt={team.name + "Flag"} className="w-[3.5vh] mr-3 border border-zinc-200" />
                                {team.name}
                            </div>
                        </td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.played}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.won}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.lost}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">{team.noResult}</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200">0</td>
                        <td className="text-center py-3 px-2 border-b border-zinc-200 font-bold">{team.points}</td>
                        <td className="text-center py-4 px-4 border-b border-zinc-200 whitespace-nowrap">{team.runsScored + "/" + (Math.floor(team.ballsFaced / 6) + "." + (team.ballsFaced % 6))}</td>
                        <td className="text-center py-4 px-4 border-b border-zinc-200 whitespace-nowrap">{team.runsConceded + "/" + (Math.floor(team.ballsBowled / 6) + "." + (team.ballsBowled % 6))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default PointsTable;