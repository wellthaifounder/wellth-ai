import confetti from 'canvas-confetti';

/**
 * Confetti animation utilities for success moments
 * Following Stripe/Rocket Money's delightful micro-interactions
 */

// Default confetti for general success
export const celebrateSuccess = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#00A9A5', '#F4C430', '#4A90E2', '#2ECC71'],
  });
};

// Special confetti for first-time achievements
export const celebrateFirstTime = () => {
  const duration = 2000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: randomInRange(0.1, 0.3),
        y: Math.random() - 0.2,
      },
      colors: ['#00A9A5', '#F4C430', '#4A90E2'],
    });

    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: randomInRange(0.7, 0.9),
        y: Math.random() - 0.2,
      },
      colors: ['#00A9A5', '#F4C430', '#4A90E2'],
    });
  }, 250);
};

// Subtle confetti for smaller wins
export const celebrateSmallWin = () => {
  confetti({
    particleCount: 50,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#00A9A5', '#F4C430'],
    ticks: 100,
  });
};

// Big celebration for major milestones
export const celebrateMilestone = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#00A9A5', '#F4C430', '#4A90E2', '#2ECC71'],
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

// Specific celebration types
export const celebrateFirstExpense = () => celebrateFirstTime();
export const celebrateFirstReimbursement = () => celebrateMilestone();
export const celebrateExpenseSaved = () => celebrateSuccess();
export const celebrateDisputeWon = () => celebrateMilestone();
export const celebrateBillReviewed = () => celebrateSmallWin();
