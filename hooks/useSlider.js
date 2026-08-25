import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook to manage image slider/carousel state.
 * Supports next/prev navigation, page indicators, direction tracking (for slide animations),
 * and autoplay with pause on hover/interaction capability.
 * 
 * @param {number} totalSlides - Total number of slides
 * @param {number} autoplaySpeed - Speed in ms (0 or null to disable autoplay)
 * @returns {object} Slider controls and state
 */
export default function useSlider(totalSlides, autoplaySpeed = 3000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = forward, -1 = backward
  const autoplayTimerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const resetAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
    if (autoplaySpeed && totalSlides > 1) {
      autoplayTimerRef.current = setInterval(() => {
        nextSlide();
      }, autoplaySpeed);
    }
  }, [autoplaySpeed, totalSlides, nextSlide]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [resetAutoplay]);

  return {
    currentIndex,
    direction,
    nextSlide,
    prevSlide,
    goToSlide,
    resetAutoplay,
  };
}
