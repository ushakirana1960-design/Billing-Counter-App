import { useState } from "react";
import { toTelugu } from "@/lib/telugu";
import { Languages } from "lucide-react";

export const TeluguInput = ({ value, onChange, placeholder, className = "", testId, autoFocus }) => {
  const [buffer, setBuffer] = useState("");

  const handle = (e) => {
    const raw = e.target.value;
    setBuffer(raw);
    onChange(toTelugu(raw));
  };

  return (
    <div className="relative">
      <input
        data-testid={testId}
        autoFocus={autoFocus}
        value={buffer}
        onChange={handle}
        placeholder={placeholder}
        className={`w-full px-3 py-2 pr-9 border-2 border-slate-300 rounded-md focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-colors ${className}`}
      />
      <Languages className="absolute right-2 top-2.5 h-4 w-4 text-blue-500" />
      {value ? (
        <div data-testid={testId ? `${testId}-preview` : undefined} className="mt-1 text-base font-semibold text-slate-900">
          {value}
        </div>
      ) : null}
    </div>
  );
};

export default TeluguInput;
