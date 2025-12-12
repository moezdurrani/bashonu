import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Trending from "./pages/Trending";
import SongDetails from "./pages/SongDetails";
import MySongs from "./pages/MySongs";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/song/:id" element={<SongDetails />} />
            <Route path="/my-songs" element={<MySongs />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
