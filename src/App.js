import React, { useState, useEffect } from 'react';
import './App.css';

const TRACKING_URL = 'https://mistakeornotphotoengagement-tracking.qwayk.workers.dev/api/track';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [floatingPoints, setFloatingPoints] = useState(null);
  const [animating, setAnimating] = useState(false);

  // Load the local image manifest on mount.
  useEffect(() => {
    fetch('/image-manifest.json')
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
        // For first-time visitors, pick a random starting image.
        const storedIndex = localStorage.getItem('startingIndex');
        let startingIndex;
        if (storedIndex !== null) {
          startingIndex = Number(storedIndex);
        } else {
          startingIndex = Math.floor(Math.random() * data.length);
          localStorage.setItem('startingIndex', startingIndex);
        }
        setCurrentIndex(startingIndex);
      })
      .catch((err) => console.error('Error loading image manifest:', err));
  }, []);

  // Track a "view" event every time the current image changes.
  useEffect(() => {
    if (images.length > 0) {
      fetch(TRACKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: images[currentIndex], event: 'view' }),
      }).catch((err) => console.error('Error tracking view:', err));
    }
  }, [currentIndex, images]);

  // Helper function to track an event.
  function trackEvent(photoId, eventType) {
    if (!photoId) return;
    fetch(TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, event: eventType }),
    }).catch((err) => console.error('Error tracking event:', err));
  }

  // Handle button click: track engagement, show feedback, preload next image, update score, and move to next image.
  const handleAnswer = () => {
    if (animating || images.length === 0) return;

    // Track an "engagement" event for the current image.
    trackEvent(images[currentIndex], 'engagement');

    // Preload the next image.
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImageSrc = `/images/${images[nextIndex]}`;
    const preloadedImg = new Image();
    preloadedImg.src = nextImageSrc;

    // Determine if the answer is correct (70% chance).
    const isCorrect = Math.random() >= 0.3;
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = 20;
      setFeedback("Awesome! You earned 20 points!");
      setFloatingPoints("+20");
    } else {
      setFeedback("Oops! No points this time!");
      setFloatingPoints(null);
    }

    setAnimating(true);

    // After 2 seconds, update the score (if correct) and switch to the preloaded next image.
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + pointsEarned);
      }
      setFeedback('');
      setFloatingPoints(null);
      setAnimating(false);
      setCurrentIndex(nextIndex);
    }, 2000);
  };

  if (images.length === 0) return <div>Loading images...</div>;

  return (
    <div className="container">
      <header>
        <div className="header-text">
          <h1>Mistake or Not</h1>
          <h2 className="tagline">You be the judge – was it made by mistake or on purpose?</h2>
        </div>
        <div className="score">
          Score: <span className="score-value">{score}</span> <span className="stars">⭐</span>
        </div>
      </header>
      <main className="image-container">
        <img src={`/images/${images[currentIndex]}`} alt="game" />
        {feedback && <div className="feedback">{feedback}</div>}
        {floatingPoints && <div className="floating-points">{floatingPoints}</div>}
        <div className="buttons">
          <button onClick={handleAnswer} disabled={animating}>
            Mistake <span className="button-icon">😇</span>
          </button>
          <button onClick={handleAnswer} disabled={animating}>
            Not a Mistake <span className="button-icon">😈</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
