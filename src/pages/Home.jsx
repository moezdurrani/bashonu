import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { faHeart as solidHeart, faEye } from "@fortawesome/free-solid-svg-icons";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";

import { generateSlug } from "../utils";


const Home = () => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newSongs, setNewSongs] = useState([]);
  const [showFeatured, setShowFeatured] = useState(false);

  const [showTrending, setShowTrending] = useState(true);
  const [showNew, setShowNew] = useState(true);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const trendingDismissed = localStorage.getItem("featuredTrendingDismissedAt");
    const newDismissed = localStorage.getItem("featuredNewDismissedAt");

    const trendingHidden = trendingDismissed && now - parseInt(trendingDismissed) < ONE_DAY;
    const newHidden = newDismissed && now - parseInt(newDismissed) < ONE_DAY;

    if (!trendingHidden) {
      setShowTrending(true);
      fetchTrending();
    } else {
      setShowTrending(false);
    }

    if (!newHidden) {
      setShowNew(true);
      fetchNewSongs();
    } else {
      setShowNew(false);
    }

    if (!trendingHidden || !newHidden) {
      setShowFeatured(true);
    }
  }, []);

  const fetchTrending = async () => {
    const { data } = await supabase.rpc("get_top_songs");
    if (data) setTrendingSongs(data.slice(0, 5));
  };

  const fetchNewSongs = async () => {
    const { data } = await supabase
      .from("songs")
      .select("id, title, likes, views, writers(name)")
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setNewSongs(data);
  };

  const handleDismissTrending = () => {
    setShowTrending(false);
    localStorage.setItem("featuredTrendingDismissedAt", Date.now().toString());
  };

  const handleDismissNew = () => {
    setShowNew(false);
    localStorage.setItem("featuredNewDismissedAt", Date.now().toString());
  };

  const fetchSongs = async () => {
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, language, display_language, likes, views, writers (name)")
      .order("title", { ascending: true });

    if (error) {
      console.log("Error fetching songs", error);
    } else {
      // console.log("First song:", data?.[0]);
      setSongs(data);
    }
  };

  const filteredSongs = songs.filter((song) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      song.title.toLowerCase().includes(term) ||
      (song.writers &&
        song.writers.name.toLowerCase().includes(term)) ||
      (song.language && song.language.toLowerCase().includes(term)) ||
      (song.display_language &&
        song.display_language.toLowerCase().includes(term));

    const matchesLanguage =
      selectedLanguage === "all" || song.language === selectedLanguage;

    return matchesSearch && matchesLanguage;
  });


  const languages = [
    "all",
    ...Array.from(
      new Set(songs.map((s) => s.language).filter(Boolean))
    ),
  ];



  console.log(songs);
  return (

    <div className="wrapper">

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            className="search-bar"
            placeholder="Search songs, poets, or by language"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="language-filter-wrapper">
        <div className="language-filter">
          {languages.map((lang) => (
            <button
              key={lang}
              className={`language-chip ${selectedLanguage === lang ? "active" : ""}`}
              onClick={() => setSelectedLanguage(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {showFeatured && (showTrending || showNew) && (
        <div className="featured-section">

          {trendingSongs.length > 0 && showTrending && (
            <div className="featured-row">
              <div className="featured-row-header">
                <p className="featured-row-title">Most Loved</p>
                <button className="featured-dismiss" onClick={handleDismissTrending}>✕</button>
              </div>
              <div className="featured-scroll">
                {trendingSongs.map((song) => (
                  <div
                    key={song.song_id}
                    className="featured-card"
                    onClick={() => navigate(`/song/${generateSlug(song.title, song.song_id)}`)}
                  >
                    <p className="featured-card-title">{song.title}</p>
                    <p className="featured-card-poet">{song.writer_name || "Unknown"}</p>
                    <p className="featured-card-score">
                      <FontAwesomeIcon icon={solidHeart} /> {song.likes ?? 0} &nbsp;
                      <FontAwesomeIcon icon={faEye} /> {song.views ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newSongs.length > 0 && showNew && (
            <div className="featured-row">
              <div className="featured-row-header">
                <p className="featured-row-title">New Additions</p>
                <button className="featured-dismiss" onClick={handleDismissNew}>✕</button>
              </div>
              <div className="featured-scroll">
                {newSongs.map((song) => (
                  <div
                    key={song.id}
                    className="featured-card"
                    onClick={() => navigate(`/song/${generateSlug(song.title, song.id)}`)}
                  >
                    <p className="featured-card-title">{song.title}</p>
                    <p className="featured-card-poet">{song.writers?.name || "Unknown"}</p>
                    <p className="featured-card-score">
                      <FontAwesomeIcon icon={solidHeart} /> {song.likes ?? 0} &nbsp;
                      <FontAwesomeIcon icon={faEye} /> {song.views ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      <div className="list-container">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="song-item"
            onClick={() => navigate(`/song/${generateSlug(song.title, song.id)}`)}
          >

            <div className="song-stats">
              <span><FontAwesomeIcon icon={solidHeart} /> {song.likes ?? 0}</span>
              <span><FontAwesomeIcon icon={faEye} /> {song.views ?? 0}</span>
            </div>

            <div className="song-sooner-card-outer">
              <div className="song-corner-card">
                <p className="song-corner-card-text">{song.language}</p>
              </div>
            </div>

            <div className="song-content">

              <div className="text-container">
                <div className="scrollable">
                  <strong>{song.title}</strong>
                </div>
              </div>

              <div className="text-container">
                <div className="scrollable">
                  <span>
                    Poet: {song.writers ? song.writers.name : "Unknown"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FontAwesomeIcon icon={faCircleArrowUp} />
        </button>
      )}


    </div>
  );
};

export default Home;
