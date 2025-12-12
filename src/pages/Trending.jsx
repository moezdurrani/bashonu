// Trending.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Trending.css";

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
        <h2>Top 5 Chitrali Songs</h2>
        {topSongs.length > 0 ? (
          topSongs.map((song) => (
            <div
              className="card clickable"
              key={song.song_id}
              onClick={() => navigate(`/song/${song.song_id}`)}
            >
              <div className="card-content">
                <div className="title-container">
                  <div className="scroll-container">
                    <span className="title-text">{song.title}</span>
                  </div>
                </div>
                <div className="stats-container">
                  <span className="stats">{song.likes} likes</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No songs found</p>
        )}
      </div>

      <div className="section">
        <h2>Top 5 Chitrali Poets</h2>
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
                    Total Likes: {writer.total_likes}
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
