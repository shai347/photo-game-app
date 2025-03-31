import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Adjust these to match your Worker URLs
const TRACKING_URL = 'https://mistakeornotphotoengagement-tracking.qwayk.workers.dev/api/track';
const PHOTO_ORDER_URL = 'https://mistakeornotphotoengagement-tracking.qwayk.workers.dev/api/photo-order';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [floatingPoints, setFloatingPoints] = useState(null);
  const [animating, setAnimating] = useState(false);

  // How often (in hours) we fetch the sorted order from the worker
  const [reorderInterval, setReorderInterval] = useState(24);

  // A reference to store when we last fetched the sorted order
  const lastReorderFetchRef = useRef(0);

  // 1) Load local image manifest
  useEffect(() => {
    fetch('/image-manifest.json')
      .then((res) => res.json())
      .then((localImages) => {
        setImages(localImages);
      })
      .catch((err) => console.error('Error loading image-manifest:', err));
  }, []);

  // 2) Each time the currentIndex changes, track a "view" event
  useEffect(() => {
    if (images.length > 0) {
      trackEvent(images[currentIndex], 'view');
    }
  }, [currentIndex, images]);

  // 3) Periodically fetch sorted order from the worker and merge with local images
  //    We do this on an interval, or if the user changes the reorderInterval.
  useEffect(() => {
    // Immediately fetch sorted order once
    fetchSortedOrder();

    // Set up an interval to fetch sorted order periodically
    const intervalId = setInterval(() => {
      fetchSortedOrder();
    }, reorderInterval * 3600 * 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorderInterval]);

  // Helper: fetch the sorted order, then reorder local images accordingly
  function fetchSortedOrder() {
    // Prevent spamming the worker if there's a bug in user input (like 0 hours)
    if (reorderInterval <= 0) return;

    fetch(PHOTO_ORDER_URL)
      .then((res) => res.json())
      .then((sortedPhotos) => {
        if (!Array.isArray(sortedPhotos) || sortedPhotos.length === 0) {
          return; // No data from worker; skip reordering
        }
        // Map photo IDs in sorted order
        const sortedIds = sortedPhotos.map((p) => p.photoId);

        // Merge with our local images: keep only those IDs that exist locally
        const localSet = new Set(images);
        const mergedOrder = sortedIds.filter((id) => localSet.has(id));

        // If mergedOrder isn't empty, reorder the local images
        if (mergedOrder.length > 0) {
          setImages(mergedOrder);
          // Optionally reset currentIndex to 0 so new visitors see top-engaging first
          // setCurrentIndex(0);
        }
      })
      .catch((err) => console.error('Error fetching sorted order:', err));
  }

  // 4) Track a single event with the Worker
  function trackEvent(photoId, eventType) {
    if (!photoId) return;
    fetch(TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, event: eventType }),
    }).catch((err) => console.error('Error tracking event:', err));
  }

  // 5) Handle button click: record "engagement", show feedback, update score, move to next photo
  const handleAnswer = () => {
    if (animating || images.length === 0) return;

    // Track engagement
    trackEvent(images[currentIndex], 'engagement');

    // 70% chance the user is "correct"
    const isCorrect = Math.random() >= 0.3;
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = 20;
      setFeedback('Awesome! You earned 20 points!');
      setFloatingPoints('+20');
    } else {
      setFeedback('Oops! No points this time!');
      setFloatingPoints(null);
    }

    setAnimating(true);

    // After 2s animation, update score and move on
    setTimeout(() => {
      if (isCorrect) {
        setScore((prev) => prev + pointsEarned);
      }
      setFeedback('');
      setFloatingPoints(null);
      setAnimating(false);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);
  };

  // Show a loading message if we have no images
  if (images.length === 0) {
    return <div>Loading images...</div>;
  }

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
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setReorderInterval(val > 0 ? val : 1); // Prevent zero or negative
                }}
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
