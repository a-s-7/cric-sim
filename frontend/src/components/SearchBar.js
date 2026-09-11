import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * SearchBar — drop-in search input with a leading icon and a clear button.
 */
export function SearchBar({
  placeholder = 'Search…',
  value,
  defaultValue = '',
  onChange,
  onSearch,
  onClear,
  autoFocus = false,
  className = '',
}) {
  const [internal, setInternal] = useState(defaultValue);
  const inputRef = useRef(null);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const setValue = (v) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  const handleClear = () => {
    setValue('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && current) {
      e.preventDefault();
      handleClear();
    }
    if (e.key === 'Enter') {
      onSearch?.(current);
    }
  };

  return (
    <div className={`group relative w-full ${className}`}>
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 transition-colors duration-200 group-focus-within:text-stone-600"
      />
      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        value={current}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-11 text-sm text-stone-800 placeholder-stone-400 shadow-sm outline-none transition-all duration-200 focus:border-stone-400 focus:ring-0"
      />
      {current && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl p-1.5 text-stone-400 transition-all duration-150 hover:bg-stone-100 hover:text-stone-600 active:scale-90"
        >
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
        </button>
      )}
    </div>
  );
}

export default function Demo() {
  const [query, setQuery] = useState('');
  return (
    <div className="flex w-full items-center justify-center bg-stone-50 px-10 py-24">
      <div className="w-full max-w-sm">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={(q) => console.log('search:', q)}
          placeholder="Search products, orders, customers…"
          autoFocus
        />
        <p className="mt-3 px-1 text-xs text-stone-400">
          {query ? `Searching for "${query}"` : 'Type to search, Esc to clear'}
        </p>
      </div>
    </div>
  );
}