function Spinner({ label = "", size = 60, strokeWidth = 2, className = "" }) {
    return (
        <div className={`w-full flex-1 flex flex-col items-center justify-center gap-4 px-4 ${className}`}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 50 50"
                className="animate-spin text-stone-400"
            >
                <circle
                    cx="25" cy="25" r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray="90 150"
                />
            </svg>
            {label && <p className="text-sm text-stone-400 bg-blue-100">{label}</p>}
        </div>
    );
}

export default Spinner;
