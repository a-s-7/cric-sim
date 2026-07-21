function WicketsInput({ value, onChange, max = 10, className = '' }) {
    return (
        <input
            className={`font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
            type="number"
            min={0}
            max={max}
            step={1}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onKeyDown={(e) => {
                if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault();
            }}
            onChange={(e) => {
                let newVal = e.target.value.replace(/^0+(?=\d)/, '');
                if (Number(newVal) > max) newVal = String(max);
                onChange(newVal);
            }}
            value={value === 0 ? '' : (value ?? '')}
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'inherit' }}
        />
    );
}

export default WicketsInput;