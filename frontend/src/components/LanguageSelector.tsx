import { useState, useEffect, useRef } from "react";
import { LANGUAGES } from "../languages";
import { useLocalization } from "../hooks/useLocalization";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { currentLanguage, setLanguage } = useLocalization();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="relative inline-flex items-center"
      ref={dropdownRef}
    >
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
      >
        <Globe className="w-4 h-4" />
        <img
          className="w-4 h-4 rounded-sm"
          src={currentLanguage.flag}
          alt={currentLanguage.name}
        />
        <span className="hidden sm:inline">{currentLanguage.id.toUpperCase()}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in duration-200">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">
              Select Language
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {LANGUAGES.sort((a,b) => a.id.localeCompare(b.id)).map((language) => (
                <button
                  key={language.id}
                  onClick={() => {
                    setLanguage(language.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full items-center flex gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 hover:bg-white/10 ${
                    currentLanguage.id === language.id
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <img
                    className="w-5 h-5 rounded-sm object-cover"
                    src={language.flag}
                    alt={language.name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {language.name}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {language.id}
                    </div>
                  </div>
                  {currentLanguage.id === language.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
