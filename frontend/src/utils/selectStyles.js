export const customStyles = {
    container: (base) => ({
        ...base,
        width: '100%',
    }),

    control: (base, state) => ({
        ...base,
        background: state.isDisabled
            ? 'rgba(255, 255, 255, 0.08)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.12) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: state.isFocused
            ? '1px solid rgba(255, 255, 255, 0.7)'
            : '1px solid rgba(255, 255, 255, 0.35)',
        boxShadow: state.isFocused
            ? '0 0 0 2px rgba(255, 255, 255, 0.25)'
            : '0 2px 6px rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        minHeight: '38px',
        maxWidth: '100%',
        overflow: 'hidden',
        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s ease',
        '&:hover': {
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.18) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
        },
    }),

    valueContainer: (base) => ({
        ...base,
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        padding: '0 10px',
        gap: '4px',
    }),

    multiValue: (base) => ({
        ...base,
        flexShrink: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        overflow: 'hidden',
    }),

    multiValueLabel: (base) => ({
        ...base,
        color: '#ffffff',
        fontWeight: 600,
        padding: '2px 8px',
    }),

    multiValueRemove: (base) => ({
        ...base,
        color: 'rgba(255,255,255,0.9)',
        borderRadius: '0 8px 8px 0',
        padding: '0 6px',
        transition: 'all 0.15s ease',
        ':hover': {
            backgroundColor: 'rgba(255, 80, 80, 0.25)',
            color: '#ffffff',
        },
    }),

    singleValue: (base) => ({
        ...base,
        width: '100%',
        color: '#ffffff',
        fontWeight: 500,
    }),

    placeholder: (base) => ({
        ...base,
        width: '100%',
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 400,
    }),

    input: (base) => ({
        ...base,
        color: '#ffffff',
        margin: 0,
        padding: 0,
    }),

    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused
            ? '#ffffff'
            : 'rgba(255, 255, 255, 0.75)',
        padding: '6px',
        transition: 'color 0.15s ease',
        ':hover': {
            color: '#ffffff',
        },
    }),

    clearIndicator: (base) => ({
        ...base,
        color: 'rgba(255, 255, 255, 0.75)',
        padding: '6px',
        transition: 'all 0.15s ease',
        ':hover': {
            color: '#ff6b6b',
        },
    }),

    indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        marginTop: '6px',
        marginBottom: '6px',
    }),

    menu: (base) => ({
        ...base,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        zIndex: 50,
    }),

    menuList: (base) => ({
        ...base,
        padding: '6px',
    }),

    option: (base, state) => ({
        ...base,
        borderRadius: '8px',
        padding: '10px 12px',
        backgroundColor: state.isSelected
            ? 'rgba(0, 0, 0, 0.12)'
            : state.isFocused
                ? 'rgba(0, 0, 0, 0.05)'
                : 'transparent',
        color: state.isSelected
            ? '#000000'
            : '#1a1a1a',
        fontWeight: state.isSelected ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        ':active': {
            backgroundColor: 'rgba(0, 0, 0, 0.18)',
        },
    }),
};