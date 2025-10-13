import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  minutes?: number;
}

export const CountdownTimer = ({ minutes = 15 }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    // Check if timer was already started in session
    const startTime = sessionStorage.getItem("tripwireTimerStart");
    const now = Date.now();

    if (startTime) {
      const elapsed = Math.floor((now - parseInt(startTime)) / 1000);
      const remaining = minutes * 60 - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    } else {
      sessionStorage.setItem("tripwireTimerStart", now.toString());
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [minutes]);

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  const isUrgent = timeLeft < 300; // Last 5 minutes

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
        isUrgent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
      }`}
    >
      <Clock className="h-4 w-4" />
      <span className="font-mono font-semibold">
        {minutesLeft}:{secondsLeft.toString().padStart(2, "0")}
      </span>
    </div>
  );
};
