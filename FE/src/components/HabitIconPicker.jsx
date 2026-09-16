import { useEffect, useRef, useState } from "react";
import { HABIT_ICONS } from "../icons/habitIcons";

const ICON_NAMES = Object.keys(HABIT_ICONS);

export default function HabitIconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filtered = ICON_NAMES.filter((icon) =>
    icon.toLowerCase().includes(query.toLowerCase()),
  );

  const selectedIcon = HABIT_ICONS[value];

  return (
    <div ref={pickerRef} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chọn biểu tượng"
        aria-expanded={open}
        className="
          grid h-10 w-10 place-items-center
          rounded-lg border border-edge
          bg-surface text-muted
          transition
          hover:border-muted hover:text-ink
          active:scale-95
        "
      >
        {selectedIcon ? (
          <img src={selectedIcon} alt="" className="h-[21px] w-[21px]" />
        ) : (
          <span className="text-lg">+</span>
        )}
      </button>

      {/* Picker */}
      {open && (
            <div
            className="
                absolute left-0 top-[calc(100%+8px)] z-100
                isolate
                w-72 rounded-xl
                border border-edge
                bg-surface
                p-3 shadow-xl
            ">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm biểu tượng..."
            className="
              mb-3 w-full rounded-lg
              border border-edge
              bg-surface
              px-3 py-2
              text-sm text-ink
              outline-none
              placeholder:text-muted
              focus:border-muted
            "
            autoFocus
          />

          <div className="grid grid-cols-8 gap-1">
            {filtered.map((icon) => {
              const Icon = HABIT_ICONS[icon];

              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onChange(icon);
                    setOpen(false);
                    setQuery("");
                  }}
                  title={icon.replaceAll("_", " ")}
                  aria-label={icon.replaceAll("_", " ")}
                  className={`
                    grid h-8 w-8 place-items-center
                    rounded-md
                    transition
                    hover:bg-surface
                    ${value === icon ? "bg-accent/10" : ""}
                  `}
                >
                  <img
                    src={Icon}
                    alt=""
                    className={`
                      h-5 w-5
                      transition
                      ${
                        value === icon
                          ? "opacity-100"
                          : "opacity-60 group-hover:opacity-100"
                      }
                    `}
                  />
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="py-4 text-center text-xs text-muted">
              Không tìm thấy biểu tượng
            </p>
          )}
        </div>
      )}
    </div>
  );
}
