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
  const [writerOption, setWriterOption] = useState("existing");
  const [hasLiked, setHasLiked] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [displayLanguageOptions, setDisplayLanguageOptions] = useState([]);


  const [editForm, setEditForm] = useState({
    title: "",
    lyrics: "",
    language: "",
    display_language: "",
    writer_id: "",
    new_writer_name: "",
  });


  useEffect(() => {
    fetchCurrentUser();
    fetchSongDetails();
    fetchWriters();
    fetchLanguageEnums();
  }, [id]);


  const fetchLanguageEnums = async () => {
    const { data: langList } = await supabase.rpc("get_enum_values", {
      enum_name: "language_enum",
    });

    const { data: dispList } = await supabase.rpc("get_enum_values", {
      enum_name: "display_language_enum",
    });

    setLanguageOptions(langList || []);
    setDisplayLanguageOptions(dispList || []);
  };


  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);

    // If there's a user, check their like status
    if (user) {
      const { data: likeData, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("song_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!likeError || likeError.code === "PGRST116") {
        setHasLiked(!!likeData);
      }
    }
  };

  const fetchWriters = async () => {
    const { data, error } = await supabase
      .from("writers")
      .select("id, name")
      .order("name", { ascending: true });

    if (!error) {
      setWriters(data);
    }
  };

  const fetchSongDetails = async () => {
    try {
      const { data: songData, error: songError } = await supabase
        .from("songs")
        .select(
          `
          *,
          writers (id, name),
          profile (id, username)
        `
        )
        .eq("id", id)
        .single();

      if (songError) throw songError;

      setSong(songData);
      setEditForm({
        title: songData.title,
        lyrics: songData.lyrics,
        language: songData.language,
        display_language: songData.display_language,
        writer_id: songData.writer_id,
        new_writer_name: "",
      });

    } catch (error) {
      console.error("Error fetching song details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to edit songs");
      return;
    }

    try {
      let finalWriterId = editForm.writer_id;

      if (writerOption === "new" && editForm.new_writer_name) {
        const { data: newWriter, error: writerError } = await supabase
          .from("writers")
          .insert([{ name: editForm.new_writer_name }])
          .select("id")
          .single();

        if (writerError) throw writerError;
        finalWriterId = newWriter.id;
      }

      const { error } = await supabase
        .from("songs")
        .update({
          title: editForm.title,
          lyrics: editForm.lyrics,
          language: editForm.language,
          display_language: editForm.display_language,
          writer_id: finalWriterId,
        })

        .eq("id", id);

      if (error) throw error;

      await fetchSongDetails();
      await fetchWriters();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating song:", error);
      setError(error.message);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      setShowLoginMessage(true);
      // Automatically hide the message after 3 seconds
      setTimeout(() => {
        setShowLoginMessage(false);
      }, 3000);
      return;
    }

    try {
      if (hasLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("song_id", id);

        if (error) throw error;
        setHasLiked(false);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert([{ user_id: currentUser.id, song_id: id }]);

        if (error) throw error;
        setHasLiked(true);
      }
    } catch (error) {
      console.error("Error liking song:", error);
      setHasLiked(!hasLiked);
    }
  };


  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container">Error: {error}</div>;
  if (!song) return <div className="container">Song not found</div>;

  const canEdit = currentUser && currentUser.id === song.user_id;

  return (
    <div className="container">
      {showLoginMessage && (
        <div className="login-message">Please log in to like songs</div>
      )}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <h2>Edit Song</h2>

          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={editForm.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Poet:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="writerOption"
                  value="existing"
                  checked={writerOption === "existing"}
                  onChange={(e) => setWriterOption(e.target.value)}
                />
                Select Existing Poet
              </label>
              <label>
                <input
                  type="radio"
                  name="writerOption"
                  value="new"
                  checked={writerOption === "new"}
                  onChange={(e) => setWriterOption(e.target.value)}
                />
                Add New Poet
              </label>
            </div>

            {writerOption === "existing" ? (
              <select
                name="writer_id"
                value={editForm.writer_id}
                onChange={handleInputChange}
                required={writerOption === "existing"}
              >
                <option value="">Select a writer</option>
                {writers.map((writer) => (
                  <option key={writer.id} value={writer.id}>
                    {writer.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="new_writer_name"
                value={editForm.new_writer_name}
                onChange={handleInputChange}
                placeholder="Enter new writer name"
                required={writerOption === "new"}
              />
            )}
          </div>

          <div className="form-group">
            <label>Song Language:</label>
            <select
              name="language"
              value={editForm.language}
              onChange={handleInputChange}
            >
              <option value="">Select Language</option>
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Lyrics Script:</label>
            <select
              name="display_language"
              value={editForm.display_language}
              onChange={handleInputChange}
            >
              <option value="">Select Display Language</option>
              {displayLanguageOptions.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Lyrics:</label>
            <textarea
              name="lyrics"
              value={editForm.lyrics}
              onChange={handleInputChange}
              style={{
                fontFamily:
                  editForm.display_language === "urdu"
                    ? "'Noto Nastaliq Urdu', serif"
                    : "Comfortaa, Arial, sans-serif, Helvetica",
                textAlign: "center",
              }}
            />
          </div>


          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <div className="song-header">
            <div className="song-header-left">
              <h1 className="song-title">{song?.title}</h1>
              <p className="song-writer">
                Poet: {song.writers?.name || "Unknown"}
              </p>
            </div>

            <div className="song-header-right">
              <button className="like-button" onClick={handleLike}>
                <FontAwesomeIcon icon={hasLiked ? solidHeart : outlineHeart} />
              </button>

              {canEdit && (
                <button
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              )}
            </div>
          </div>

          <div className="lyrics">
            <pre
              style={{
                fontFamily:
                  song?.display_language === "urdu"
                    ? "'Noto Nastaliq Urdu', serif"
                    : "Comfortaa, Arial, sans-serif, Helvetica",
              }}
            >
              {song?.lyrics}
            </pre>
          </div>

          <p className="uploader-name">
            <strong>Uploaded by:</strong>{" "}
            {song.profile?.username || "Unknown"}
          </p>
        </>

      )}
    </div>
  );
};

export default SongDetails;