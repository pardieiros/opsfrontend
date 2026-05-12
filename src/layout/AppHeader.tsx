import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchOrdensProducao } from "../serviceapi/api";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import BarcodeScannerModal from "../components/Imprimir360/BarcodeScannerModal";
import PrinterSettingsModal from "../components/Imprimir360/PrinterSettingsModal";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      
      // Navegar com Enter quando há sugestões
      if (event.key === "Enter" && suggestions.length > 0 && document.activeElement === inputRef.current) {
        event.preventDefault();
        const firstSuggestion = suggestions[0];
        console.log('🔍 Selecionando primeira OP da pesquisa com Enter:', firstSuggestion.id, firstSuggestion.nome_trabalho);
        setSuggestions([]);
        setSearchTerm('');
        navigate('/ops/gerir', { 
          state: { 
            selectedOpId: firstSuggestion.id,
            fromSearch: true 
          } 
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestions, navigate]);

  useEffect(() => {
    let active = true;
    const handler = setTimeout(() => {
      if (!searchTerm) {
        setSuggestions([]);
        setLoadingSuggestions(false);
        return;
      }
      setLoadingSuggestions(true);
      fetchOrdensProducao({ search: searchTerm })
        .then(data => {
          if (active) setSuggestions(data.results);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        })
        .finally(() => {
          if (active) setLoadingSuggestions(false);
        });
    }, 600); // 300ms debounce delay

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchRef]);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
            {/* Cross Icon */}
          </button>

          <Link to="/" className="lg:hidden">
            <img
              className="h-12 w-12 object-contain"
              src="/icon-512.png"
              alt="Logo"
            />
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <div className="hidden lg:block">
            <div ref={searchRef} className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Pesquisar OP..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
              />
              <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                <span>⌘</span><span>K</span>
              </button>
              {loadingSuggestions ? (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded z-50 p-2 text-center text-gray-500">
                  Carregando...
                </div>
              ) : (
                suggestions.length > 0 && (
                  <ul className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded z-50 max-h-60 overflow-auto">
                    {suggestions.map((op, index) => (
                      <li key={op.id}>
                        <button
                          onClick={() => {
                            console.log('🔍 Selecionando OP da pesquisa:', op.id, op.nome_trabalho);
                            setSuggestions([]);
                            setSearchTerm('');
                            navigate('/ops/gerir', { 
                              state: { 
                                selectedOpId: op.id,
                                fromSearch: true 
                              } 
                            });
                          }}
                          className={`block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors ${
                            index === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {op.nome_trabalho || `OP ${op.id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {op.id} • Cliente: {op.cliente_nome2}
                          </div>
                          {index === 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Pressione Enter para selecionar
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Abrir scanner"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 7V5C4 4.44772 4.44772 4 5 4H7M17 4H19C19.5523 4 20 4.44772 20 5V7M20 17V19C20 19.5523 19.5523 20 19 20H17M7 20H5C4.44772 20 4 19.5523 4 19V17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12H17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M9 9H15V15H9V9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsPrinterSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Definições das impressoras"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M19.4 15C19.2667 15.3 19.2 15.45 19.2 15.6C19.2 15.75 19.2667 15.9 19.4 16.2L19.51 16.44C19.89 17.27 20.08 17.685 19.9978 18.0291C19.9157 18.3732 19.5832 18.6295 18.9182 19.142L18.7261 19.2901C18.486 19.4752 18.3659 19.5678 18.24 19.6156C18.1141 19.6633 17.9498 19.6656 17.6212 19.6702L17.3054 19.6746C16.9998 19.6789 16.847 19.6811 16.7156 19.7316C16.5842 19.7821 16.4654 19.881 16.2278 20.0788L15.9865 20.2798C15.4273 20.7458 15.1478 20.9788 14.8242 21.0175C14.5006 21.0562 14.1502 20.895 13.4496 20.5726L13.1518 20.4356C12.7995 20.2735 12.6233 20.1924 12.44 20.1924C12.2567 20.1924 12.0805 20.2735 11.7282 20.4356L11.4304 20.5726C10.7298 20.895 10.3794 21.0562 10.0558 21.0175C9.73221 20.9788 9.45272 20.7458 8.89352 20.2798L8.65219 20.0788C8.41461 19.881 8.29582 19.7821 8.16442 19.7316C8.03301 19.6811 7.88021 19.6789 7.57461 19.6746L7.25882 19.6702C6.93018 19.6656 6.76585 19.6633 6.63996 19.6156C6.51408 19.5678 6.39402 19.4752 6.1539 19.2901L5.96183 19.142C5.29678 18.6295 4.96426 18.3732 4.88215 18.0291C4.80003 17.685 4.99002 17.27 5.37 16.44L5.48 16.2C5.61333 15.9 5.68 15.75 5.68 15.6C5.68 15.45 5.61333 15.3 5.48 15L5.37 14.76C4.99002 13.93 4.80003 13.515 4.88215 13.1709C4.96426 12.8268 5.29678 12.5705 5.96183 12.058L6.1539 11.9099C6.39402 11.7248 6.51408 11.6322 6.63996 11.5844C6.76585 11.5367 6.93018 11.5344 7.25882 11.5298L7.57461 11.5254C7.88021 11.5211 8.03301 11.5189 8.16442 11.4684C8.29582 11.4179 8.41461 11.319 8.65219 11.1212L8.89352 10.9202C9.45272 10.4542 9.73221 10.2212 10.0558 10.1825C10.3794 10.1438 10.7298 10.305 11.4304 10.6274L11.7282 10.7644C12.0805 10.9265 12.2567 11.0076 12.44 11.0076C12.6233 11.0076 12.7995 10.9265 13.1518 10.7644L13.4496 10.6274C14.1502 10.305 14.5006 10.1438 14.8242 10.1825C15.1478 10.2212 15.4273 10.4542 15.9865 10.9202L16.2278 11.1212C16.4654 11.319 16.5842 11.4179 16.7156 11.4684C16.847 11.5189 16.9998 11.5211 17.3054 11.5254L17.6212 11.5298C17.9498 11.5344 18.1141 11.5367 18.24 11.5844C18.3659 11.6322 18.486 11.7248 18.7261 11.9099L18.9182 12.058C19.5832 12.5705 19.9157 12.8268 19.9978 13.1709C20.08 13.515 19.89 13.93 19.51 14.76L19.4 15Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* <!-- Dark Mode Toggler --> */}
            <ThemeToggleButton />
            {/* <!-- Dark Mode Toggler --> */}
            <NotificationDropdown />
            {/* <!-- Notification Menu Area --> */}
          </div>
          {/* <!-- User Area --> */}
          <UserDropdown />
        </div>
      </div>
      <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />
    </header>
  );
};

export default AppHeader;
