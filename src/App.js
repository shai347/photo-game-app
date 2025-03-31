import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [floatingPoints, setFloatingPoints] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetch('/image-manifest.json')
      .then(res => res.json())
      .then(data => {
        setImages(data);
      });
  }, []);

  // Trigger page view events when the current image changes
  useEffect(() => {
    // Google Analytics: record a virtual page view
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: `/photo/${currentIndex}`,
      });
    }
    // Plausible Analytics: record a virtual page view
    if (typeof window.plausible === 'function') {
      window.plausible('pageview');
    }
  }, [currentIndex]);

  const handleAnswer = () => {
    if (animating) return; // Prevent multiple clicks during animation

    // Increase chance for a correct answer (70% correct)
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

    // Extend feedback duration to 2.5 seconds for readability
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + pointsEarned);
      }
      setFeedback('');
      setFloatingPoints(null);
      setAnimating(false);
      setCurrentIndex((currentIndex + 1) % images.length);
    }, 2500);
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
          Score: {score} <span className="stars">⭐</span>
        </div>
      </header>
      <main className="image-container">
        <img
          src={`/images/${images[currentIndex]}`}
          alt="game"
        />
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
