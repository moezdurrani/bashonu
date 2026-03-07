// Trending.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Trending.css";
import { generateSlug } from "../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart, faEye } from "@fortawesome/free-solid-svg-icons";

// in onClick:


const Trending = () => {
  const navigate = useNavigate();
  const [topSongs, setTopSongs] = useState([]);
  const [topWriters, setTopWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      setError("");

      const { data: songsData, error: songsError } = await supabase.rpc(
        "get_top_songs"
      );
      if (songsError)
        throw new Error("Failed to fetch top songs: " + songsError.message);

      const { data: writersData, error: writersError } = await supabase.rpc(
        "get_top_writers"
      );
      if (writersError)
        throw new Error("Failed to fetch top writers: " + writersError.message);

      setTopSongs(songsData || []);
      setTopWriters(writersData || []);
    } catch (err) {
      setError(err.message);
      setTopSongs([]);
      setTopWriters([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="wrapper">
        <p>Loading trending data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrapper">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <div className="section">
        <h2>Trending Songs</h2>
        {topSongs.length > 0 ? (
          topSongs.map((song) => (
            <div
              className="card clickable"
              key={song.song_id}
              onClick={() => navigate(`/song/${generateSlug(song.title, song.song_id)}`)}
            >
              <div className="card-content">
                <div className="title-container">
                  <div className="scroll-container">
                    <span className="title-text">{song.title}</span>
                  </div>
                </div>
                <div className="stats-container">
                  <span className="stats">
                    <FontAwesomeIcon icon={solidHeart} /> {song.likes}&nbsp;&nbsp;
                    <FontAwesomeIcon icon={faEye} /> {song.views}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No songs found</p>
        )}
      </div>

      <div className="section">
        <h2>Trending Poets</h2>
        {topWriters.length > 0 ? (
          topWriters.map((writer) => (
            <div className="card" key={writer.writer_id}>
              <div className="card-content">
                <div className="title-container">
                  <div className="scroll-container">
                    <span className="title-text">{writer.name}</span>
                  </div>
                </div>
                <div className="stats-container">
                  <span className="stats">
                    <FontAwesomeIcon icon={solidHeart} /> {writer.total_likes}&nbsp;&nbsp;
                    <FontAwesomeIcon icon={faEye} /> {writer.total_views}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No writers found</p>
        )}
      </div>
    </div>
  );
};

export default Trending;
