import anime from "animejs";

export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function animatePageEntrance(targets: string | HTMLElement | Element | null) {
  if (!targets || isReducedMotion()) return;
  anime({
    targets,
    opacity: [0, 1],
    translateY: [12, 0],
    easing: "easeOutCubic",
    duration: 250,
  });
}

export function animateCardStagger(targets: string | HTMLElement[] | NodeListOf<Element>) {
  if (!targets || isReducedMotion()) return;
  anime({
    targets,
    opacity: [0, 1],
    translateY: [16, 0],
    delay: anime.stagger(50),
    easing: "easeOutCubic",
    duration: 300,
  });
}

export function animateModalOpen(targets: string | HTMLElement | Element | null) {
  if (!targets || isReducedMotion()) return;
  anime({
    targets,
    opacity: [0, 1],
    scale: [0.96, 1],
    easing: "easeOutCubic",
    duration: 200,
  });
}

export function animateTimelineStepSuccess(targets: string | HTMLElement | Element | null) {
  if (!targets || isReducedMotion()) return;
  anime({
    targets,
    scale: [0.8, 1.15, 1],
    easing: "easeInOutQuad",
    duration: 350,
  });
}

export function animateButtonPress(targets: string | HTMLElement | Element | null) {
  if (!targets || isReducedMotion()) return;
  anime({
    targets,
    scale: [1, 0.97, 1],
    easing: "easeOutQuad",
    duration: 150,
  });
}
