import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./MySongs.css"; // Assuming you will use similar styling

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const MySongs = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Added for search functionality

  useEffect(() => {
    fetchMySongs();
  }, []);

  const fetchMySongs = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        setError(
          `Failed to find user: ${userError?.message || "User not found"}`
        );
        setLoading(false);
        return;
      }

      const { data: songsData, error: songsError } = await supabase
        .from("songs")
        .select("id, title, language, display_language, writers (name)")
        .order("title", { ascending: true })
        .eq("user_id", user.id);

      if (songsError) {
        setError(`Failed to fetch songs: ${songsError.message}`);
        setSongs([]);
      } else {
        setSongs(songsData);
      }
    } catch (error) {
      setError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.writers &&
        song.writers.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSongClick = (songId) => {
    navigate(`/song/${songId}`);
  };

  if (loading)
    return (
      <div className="wrapper">
        <p>Loading your songs...</p>
      </div>
    );
  if (error)
    return (
      <div className="wrapper">
        <p>Error: {error}</p>
      </div>
    );
  if (!songs.length)
    return (
      <div className="wrapper">
        <p>You haven't uploaded any songs yet</p>
      </div>
    );

  return (
    <div className="wrapper">
      <h1>My Songs</h1> {/* Ensure the title is prominently displayed */}
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
            onClick={() => handleSongClick(song.id)}
          >
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
                    Writer: {song.writers ? song.writers.name : "Unknown"}
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

export default MySongs;
