import { useState, useEffect } from 'react';

interface TypewriterStatusProps {
  steps: string[];
  intervalMs?: number;
}

export default function TypewriterStatus({ steps, intervalMs = 2200 }: TypewriterStatusProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (steps.length === 0) return;

    const targetText = steps[currentStepIndex];
    let charIdx = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (charIdx <= targetText.length) {
        setDisplayedText(targetText.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);

        // Schedule transition to next step if not at last step
        if (currentStepIndex < steps.length - 1) {
          setTimeout(() => {
            setCurrentStepIndex((prev) => prev + 1);
          }, intervalMs);
        }
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [currentStepIndex, steps, intervalMs]);

  return (
    <div className="typewriter-status-container">
      <div className="status-sparkle">✨</div>
      <div className="status-text-wrapper">
        <span className="status-text">{displayedText}</span>
        <span className={`status-cursor ${isTyping ? 'blinking' : ''}`}>▌</span>
      </div>
    </div>
  );
}
