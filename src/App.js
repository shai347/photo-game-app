import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    fetch('/image-manifest.json')
      .then(res => res.json())
      .then(data => {
        setImages(data);
      });
  }, []);

  const handleAnswer = () => {
    const isCorrect = Math.random() >= 0.5;
    if (isCorrect) {
      setScore(score + 1);
    }
    setAnimationClass('fade');
    setTimeout(() => {
      setAnimationClass('');
      setCurrentIndex((currentIndex + 1) % images.length);
    }, 500);
  };

  if (images.length === 0) return <div>Loading images...</div>;

  return (
    <div className="container">
      <header>
        <h1>Photo Game</h1>
        <div className="score">Score: {score}</div>
      </header>
      <main>
        <img
          src={`/images/${images[currentIndex]}`}
          alt="game"
          className={animationClass}
        />
        <div className="buttons">
          <button onClick={handleAnswer}>Mistake</button>
          <button onClick={handleAnswer}>Not a Mistake</button>
        </div>
      </main>
    </div>
  );
}

export default App;
