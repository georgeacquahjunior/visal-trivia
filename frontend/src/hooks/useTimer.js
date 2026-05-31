import { useEffect, useRef, useState } from "react";

export function useTimer(initialTime, isActive, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const onExpireRef = useRef(onExpire);

  // Keep the latest callback ref to avoid triggering unnecessary effect runs
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Reset the timer when the initial time changes (e.g., next question)
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (timeLeft <= 0) {
      onExpireRef.current();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  return timeLeft;
}