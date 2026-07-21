import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function FetchStatusButton({
    show,
    icon,
    title,
    bgColor,
    borderColor,
    animationName,
}) {
    return (
        <button
            className="absolute inset-0 flex items-center justify-center rounded-full shadow-sm border"
            title={title}
            onClick={(e) => e.stopPropagation()}
            style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                opacity: show ? 1 : 0,
                transform: show ? 'scale(1)' : 'scale(0.5)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                pointerEvents: show ? 'auto' : 'none',
                animation: show ? `${animationName} 1.2s ease-in-out infinite` : 'none',
            }}
        >
            <FontAwesomeIcon icon={icon} style={{ fontSize: '0.85vh', color: 'white' }} />
        </button>
    );
}

export default FetchStatusButton;