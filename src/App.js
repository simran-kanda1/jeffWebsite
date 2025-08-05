import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './header';
import SearchPage from './SearchPage';
import AboutPage from './AboutPage';
import PropertyDetailsPage from './PropertyDetailsPage';

// Wrapper component to handle property details routing
const PropertyDetailsWrapper = () => {
  const { mlsNumber } = useParams();
  const navigate = useNavigate();
  
  return (
    <PropertyDetailsPage 
      mlsNumber={mlsNumber}
      onBack={() => navigate('/')}
    />
  );
};

const App = () => {
  return (
    <Router>
      <div className="App">
        <Header />
        
        <Routes>
          {/* Home/Search page route */}
          <Route path="/" element={<SearchPage />} />
          
          {/* About page route */}
          <Route path="/about" element={<AboutPage />} />
          
          {/* Property details route */}
          <Route path="/property/:mlsNumber" element={<PropertyDetailsWrapper />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;