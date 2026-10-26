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
        minHeight: '42px',
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

    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
        fontFamily: "'Reem Kufi Fun', sans-serif",
        textTransform: 'uppercase',
    }),

    menuList: (base) => ({
        ...base,
        padding: '6px',
    }),

    option: (base, state) => ({
        ...base,
        borderRadius: '8px',
        fontSize: '13px',
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

export const venueFilterStyles = {
    container: (base) => ({ ...base, width: '100%' }),
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '12px',
        borderColor: state.isFocused ? '#a8a29e' : '#e7e5e4',
        backgroundColor: '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(168, 162, 158, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
        '&:hover': { borderColor: '#a8a29e' },
    }),
    valueContainer: (base) => ({
        ...base,
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '2px 10px',
        gap: '4px',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
    }),
    multiValue: (base) => ({ ...base, flexShrink: 0, borderRadius: '7px', backgroundColor: '#f5f5f4' }),
    multiValueLabel: (base) => ({ ...base, color: '#44403c', fontSize: '12px', fontWeight: 600 }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#78716c',
        borderRadius: '0 7px 7px 0',
        ':hover': { color: '#b91c1c', backgroundColor: '#fee2e2' },
    }),
    placeholder: (base) => ({ ...base, color: '#78716c', fontSize: '14px' }),
    input: (base) => ({ ...base, color: '#292524', fontSize: '14px' }),
    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? '#44403c' : '#a8a29e',
        ':hover': { color: '#292524' },
    }),
    clearIndicator: (base) => ({ ...base, color: '#a8a29e', ':hover': { color: '#b91c1c' } }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: '#e7e5e4' }),
    menu: (base) => ({
        ...base,
        zIndex: 50,
        border: '1px solid #e7e5e4',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999, fontFamily: "'Nunito Sans', sans-serif" }),
    menuList: (base) => ({ ...base, padding: '6px' }),
    option: (base, state) => ({
        ...base,
        borderRadius: '8px',
        padding: '9px 12px',
        fontSize: '14px',
        color: state.isSelected ? '#ffffff' : '#44403c',
        backgroundColor: state.isSelected ? '#1c1917' : state.isFocused ? '#f5f5f4' : 'transparent',
        ':active': { backgroundColor: '#e7e5e4' },
    }),
};
