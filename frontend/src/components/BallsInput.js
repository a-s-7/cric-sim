import React, { useState, useEffect, useCallback } from "react";

function BallsInput({ width = "4.5ch", mode, value, onChange, max, readOnly = false }) {
    const [text, setText] = useState('');
    const [focused, setFocused] = useState(false);

    function formatOvers(balls) {
        const overs = Math.floor(balls / 6);
        const ballsLeft = balls % 6;
        return ballsLeft ? `${overs}.${ballsLeft}` : `${overs}`;
    }

    const format = useCallback((balls) => {
        if (!balls) return '';
        return mode === 'balls' ? String(balls) : formatOvers(balls);
    }, [mode]);

    // Only sync from external value when the field isn't being actively edited,
    // otherwise this clobbers whatever the user is mid-typing.
    useEffect(() => {
        if (focused) return;
        setText(format(value));
    }, [value, focused, format]);

    function emit(balls) {
        let capped = balls < 0 ? 0 : balls;
        if (max != null && capped > Number(max)) capped = Number(max);
        onChange?.(capped);
        return capped;
    }

    function handleTyping(e) {
        if (readOnly) return;
        const typed = e.target.value;

        if (mode === 'balls') {
            const digitsOnly = typed.replace(/\D/g, '');
            const capped = emit(Number(digitsOnly) || 0);
            // Only override the user's raw text if capping actually changed the value
            setText(capped === Number(digitsOnly) ? digitsOnly : String(capped || ''));
            return;
        }

        // Allow free typing of digits + a single '.', without reformatting away
        // trailing dots/empty ball parts while the user is still typing.
        let cleaned = typed.replace(/[^\d.]/g, '');
        const firstDot = cleaned.indexOf('.');
        if (firstDot !== -1) {
            cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
        }
        const [wholePart, ballPartRaw] = cleaned.split('.');
        let ballPart = ballPartRaw !== undefined ? ballPartRaw.slice(0, 1) : undefined;
        if (ballPart && Number(ballPart) > 5) ballPart = '5';

        const rawDisplay = ballPartRaw !== undefined ? `${wholePart}.${ballPart ?? ''}` : cleaned;
        const totalBalls = (Number(wholePart) || 0) * 6 + (Number(ballPart) || 0);
        const capped = emit(totalBalls);

        setText(capped === totalBalls ? rawDisplay : formatOvers(capped));
    }

    function handleFocus() {
        if (readOnly) return;
        setFocused(true);
    }

    function handleBlur() {
        setFocused(false);
        setText(format(value));
    }

    function handleKeyDown(e) {
        if (readOnly) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const delta = e.key === 'ArrowUp' ? 1 : -1;
            const capped = emit((Number(value) || 0) + delta);
            setText(format(capped));
            return;
        }
        if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault();
    }

    return (
        <input className="border border-gray-300 text-[1.75vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0"
            type="text"
            style={{ width }}
            value={text}
            readOnly={readOnly}
            onFocus={handleFocus}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
        />
    );
}

export default BallsInput;