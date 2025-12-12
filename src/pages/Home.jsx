import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, language, display_language, writers (name)")
      .order("title", { ascending: true });

    if (error) {
      console.log("Error fetching songs", error);
    } else {
      // console.log("First song:", data?.[0]);
      setSongs(data);
    }
  };

  const filteredSongs = songs.filter((song) => {
    return (
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.writers &&
        song.writers.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  console.log(songs);
  return (
    <div className="wrapper">

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            className="search-bar"
            placeholder="Search songs or poets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="list-container">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="song-item"
            onClick={() => navigate(`/song/${song.id}`)}
          >
            <div className="song-corner-card">
              <p className="song-corner-card-text">{song.language}</p>
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
    </div>
  );
};

export default Home;
