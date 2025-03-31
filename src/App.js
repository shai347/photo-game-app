import React, { useState, useEffect } from 'react';
import './App.css';

// Worker endpoints (use the full URLs to your Cloudflare Worker)
const TRACKING_URL = 'https://mistakeornotphotoengagement-tracking.qwayk.workers.dev/api/track';
const PHOTO_ORDER_URL = 'https://mistakeornotphotoengagement-tracking.qwayk.workers.dev/api/photo-order';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [floatingPoints, setFloatingPoints] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [reorderInterval, setReorderInterval] = useState(24); // default: 24 hours

  // Load initial image manifest from local file
  useEffect(() => {
    fetch('/image-manifest.json')
      .then(res => res.json())
      .then(data => {
        setImages(data);
      });
  }, []);

  // Track a "view" event each time the current image changes
  useEffect(() => {
    if (images.length > 0) {
      fetch(TRACKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: images[currentIndex], event: 'view' }),
      }).catch(err => console.error('Error tracking view:', err));
    }
  }, [currentIndex, images]);

  // Periodically fetch sorted order from the tracking worker
  useEffect(() => {
    const fetchSortedOrder = () => {
      fetch(PHOTO_ORDER_URL)
        .then(res => res.json())
        .then(sortedPhotos => {
          if (sortedPhotos.length > 0) {
            // Update the images array with the sorted order by engagement ratio
            setImages(sortedPhotos.map(photo => photo.photoId));
          }
        })
        .catch(err => console.error('Error fetching sorted order:', err));
    };

    fetchSortedOrder(); // initial fetch
    const intervalId = setInterval(fetchSortedOrder, reorderInterval * 3600 * 1000);
    return () => clearInterval(intervalId);
  }, [reorderInterval]);

  // Handle button click: record engagement, show feedback, update score, and transition to next photo.
  const handleAnswer = () => {
    if (animating) return; // Prevent multiple clicks during animation

    // Record engagement event for the current photo
    if (images.length > 0) {
      fetch(TRACKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: images[currentIndex], event: 'engagement' }),
      }).catch(err => console.error('Error tracking engagement:', err));
    }

    // Determine if answer is correct (70% chance to be correct)
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

    // Transition to next photo after a 2-second animation
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + pointsEarned);
      }
      setFeedback('');
      setFloatingPoints(null);
      setAnimating(false);
      setCurrentIndex((currentIndex + 1) % images.length);
    }, 2000);
  };

  if (images.length === 0) return <div>Loading images...</div>;

  return (
    <div className="container">
      <header>
        <div className="header-text">
          <h1>Mistake or Not</h1>
          <h2 className="tagline">You be the judge – was it made by mistake or on purpose?</h2>
          <div className="settings">
            <label>
              Reordering Interval (hours):
              <input
                type="number"
                value={reorderInterval}
                onChange={(e) => setReorderInterval(Number(e.target.value))}
                min="1"
              />
            </label>
          </div>
        </div>
        <div className="score">
          Score: <span className="score-value">{score}</span> <span className="stars">⭐</span>
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
