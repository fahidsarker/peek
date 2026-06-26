import { format } from "date-fns";
import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="font-console text-sm text-muted">
      {format(now, "MM/dd/yyyy h:mm a")}
    </p>
  );
}
