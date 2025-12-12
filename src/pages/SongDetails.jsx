import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SongDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as outlineHeart } from "@fortawesome/free-regular-svg-icons";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

const SongDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [song, setSong] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  // NEW unified lyrics & language form
  const [editForm, setEditForm] = useState({
    title: "",
    lyrics: "",
    language: "",
    display_language: "",
    writer_id: "",
    new_writer_name: ""
  });

  const [writerOption, setWriterOption] = useState("existing");

  useEffect(() => {
    fetchCurrentUser();
    fetchSongDetails();
    fetchWriters();
  }, [id]);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUser(user);

    if (user) {
      const { data: likeData } = await supabase
        .from("likes")
        .select("id")
        .eq("song_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      setHasLiked(!!likeData);
    }
  };

  const fetchWriters = async () => {
    const { data } = await supabase
      .from("writers")
      .select("id, name")
      .order("name");

    if (data) setWriters(data);
  };

  const fetchSongDetails = async () => {
    try {
      const { data: songData, error } = await supabase
        .from("songs")
        .select(`
          *,
          writers (id, name),
          profile (id, username)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setSong(songData);

      setEditForm({
        title: songData.title,
        lyrics: songData.lyrics,
        language: songData.language,
        display_language: songData.display_language,
        writer_id: songData.writer_id,
        new_writer_name: ""
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to edit.");
      return;
    }

    try {
      let finalWriterId = editForm.writer_id;

      if (writerOption === "new" && editForm.new_writer_name.trim().length) {
        const { data: newWriter, error } = await supabase
          .from("writers")
          .insert([{ name: editForm.new_writer_name }])
          .select("id")
          .single();

        if (error) throw error;

        finalWriterId = newWriter.id;
      }

      const { error } = await supabase
        .from("songs")
        .update({
          title: editForm.title,
          lyrics: editForm.lyrics,
          language: editForm.language,
          display_language: editForm.display_language,
          writer_id: finalWriterId
        })
        .eq("id", id);

      if (error) throw error;

      await fetchSongDetails();
      setIsEditing(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
      return;
    }

    try {
      if (hasLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("song_id", id);

        setHasLiked(false);
      } else {
        await supabase
          .from("likes")
          .insert([{ user_id: currentUser.id, song_id: id }]);

        setHasLiked(true);
      }
    } catch {
      setHasLiked(!hasLiked);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container">Error: {error}</div>;
  if (!song) return <div className="container">Song not found</div>;

  const canEdit = currentUser && currentUser.id === song.user_id;

  // Font logic based on display_language
  const fontStyle =
    editForm.display_language === "khowar" || song.display_language === "khowar"
      ? { fontFamily: "'Noto Nastaliq Urdu', serif", textAlign: "center" }
      : { fontFamily: "Comfortaa, Arial, sans-serif", textAlign: "center" };

  return (
    <div className="container">
      {showLoginMessage && (
        <div className="login-message">Please log in to like songs</div>
      )}

      {!isEditing ? (
        <>
          <h1>{song.title}</h1>

          <div className="controls-container">
            {canEdit && (
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
            )}

            <button className="like-button" onClick={handleLike}>
              <FontAwesomeIcon icon={hasLiked ? solidHeart : outlineHeart} />
            </button>
          </div>

          <div className="lyrics-display">
            <pre style={fontStyle}>{song.lyrics}</pre>
          </div>

          <p className="writer-name-bottom">
            <strong>Writer:</strong> {song.writers?.name || "Unknown"}
          </p>

          <p>
            <strong>Uploaded by:</strong> {song.profile?.username || "Unknown"}
          </p>
        </>
      ) : (
        <form className="edit-form" onSubmit={handleSubmit}>
          <h2>Edit Song</h2>

          <label>Song Title:</label>
          <input
            type="text"
            name="title"
            value={editForm.title}
            onChange={handleInputChange}
          />

          <label>Song Language:</label>
          <select
            name="language"
            value={editForm.language}
            onChange={handleInputChange}
          >
            <option value="khowar">Khowar</option>
            <option value="english">English</option>
          </select>

          <label>Display Language:</label>
          <select
            name="display_language"
            value={editForm.display_language}
            onChange={handleInputChange}
          >
            <option value="khowar">Khowar</option>
            <option value="english">English</option>
          </select>

          <label>Lyrics:</label>
          <textarea
            name="lyrics"
            value={editForm.lyrics}
            onChange={handleInputChange}
            style={fontStyle}
          />

          <label>Writer:</label>
          <select
            name="writer_id"
            value={editForm.writer_id}
            onChange={handleInputChange}
          >
            {writers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};

export default SongDetails;
