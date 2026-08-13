function DeductionInput({ value, onChange, className = '', height = 'h-full', displayMessage = '' }) {
    return (
        <input
            className={`font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[40%] ${height} text-[2vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
            type="number"
            min={0}
            step={1}
            placeholder={displayMessage}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onKeyDown={(e) => {
                if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault();
            }}
            onChange={(e) => onChange(e.target.value.replace(/^0+(?=\d)/, ''))}
            value={value === 0 ? '' : (value ?? '')}
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'inherit' }}
        />
    );
}

export default DeductionInput;