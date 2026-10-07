import React from "react";

function PreseededTeamIdentity({ teamId, name, logo, muted = false }) {
    return (
        <span
            title={name || teamId}
            className={`inline-flex min-w-0 justify-self-start items-center gap-1.5 font-bold ${muted ? "opacity-70" : "text-zinc-800"}`}
        >
            {logo && (
                <img
                    src={logo}
                    alt=""
                    className="h-auto w-5 shrink-0 border-[0.5px] border-zinc-200 object-contain"
                />
            )}
            <span className={`truncate ${muted ? "text-zinc-400 line-through" : ""}`}>{teamId}</span>
        </span>
    );
}

export default PreseededTeamIdentity;
