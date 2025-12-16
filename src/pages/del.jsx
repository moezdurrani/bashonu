import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SongDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as outlineHeart } from "@fortawesome/free-regular-svg-icons";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

const SongDetails = () => {
    const { id } = useParams();

    const [song, setSong] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentUser, setCurrentUser] = useState(null);
    const [hasLiked, setHasLiked] = useState(false);
    const [showLoginMessage, setShowLoginMessage] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [writers, setWriters] = useState([]);
    const [writerOption, setWriterOption] = useState("existing");

    const [languageOptions, setLanguageOptions] = useState([]);
    const [displayLanguageOptions, setDisplayLanguageOptions] = useState([]);

    const [isTransliterate, setIsTransliterate] = useState(false);

    const [editForm, setEditForm] = useState({
        title: "",
        lyrics: "",
        language: "",
        display_language: "",
        writer_id: "",
        new_writer_name: "",
    });

    /* -------------------- LOAD DATA -------------------- */

    useEffect(() => {
        fetchCurrentUser();
        fetchSong();
        fetchWriters();
        fetchLanguageEnums();
    }, [id]);

    const fetchCurrentUser = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        setCurrentUser(user);

        if (user) {
            const { data } = await supabase
                .from("likes")
                .select("id")
                .eq("song_id", id)
                .eq("user_id", user.id)
                .maybeSingle();

            setHasLiked(!!data);
        }
    };

    const fetchSong = async () => {
        try {
            const { data, error } = await supabase
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

            if (error) throw error;

            setSong(data);
            setEditForm({
                title: data.title,
                lyrics: data.lyrics,
                language: data.language,
                display_language: data.display_language,
                writer_id: data.writer_id,
                new_writer_name: "",
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchWriters = async () => {
        const { data } = await supabase
            .from("writers")
            .select("id, name")
            .order("name", { ascending: true });

        setWriters(data || []);
    };

    const fetchLanguageEnums = async () => {
        const { data: langs } = await supabase.rpc("get_enum_values", {
            enum_name: "language_enum",
        });

        const { data: dispLangs } = await supabase.rpc("get_enum_values", {
            enum_name: "display_language_enum",
        });

        setLanguageOptions(langs || []);
        setDisplayLanguageOptions(dispLangs || []);
    };

    /* -------------------- LIKE HANDLER -------------------- */

    const handleLike = async () => {
        if (!currentUser) {
            setShowLoginMessage(true);
            setTimeout(() => setShowLoginMessage(false), 3000);
            return;
        }

        if (hasLiked) {
            await supabase
                .from("likes")
                .delete()
                .eq("song_id", id)
                .eq("user_id", currentUser.id);
            setHasLiked(false);
        } else {
            await supabase.from("likes").insert([
                {
                    song_id: id,
                    user_id: currentUser.id,
                },
            ]);
            setHasLiked(true);
        }
    };

    /* -------------------- EDIT HANDLERS -------------------- */

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateSong = async (e) => {
        e.preventDefault();

        let finalWriterId = editForm.writer_id;

        if (writerOption === "new") {
            const { data, error } = await supabase
                .from("writers")
                .insert([{ name: editForm.new_writer_name }])
                .select("id")
                .single();

            if (error) {
                setError(error.message);
                return;
            }

            finalWriterId = data.id;
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

        if (error) {
            setError(error.message);
            return;
        }

        setIsEditing(false);
        fetchSong();
    };

    /* -------------------- RENDER -------------------- */

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
                <form onSubmit={handleUpdateSong} className="edit-form">
                    <h2>Edit Song</h2>

                    <label>Title</label>
                    <input name="title" value={editForm.title} onChange={handleChange} />

                    <label>Writer</label>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                checked={writerOption === "existing"}
                                onChange={() => setWriterOption("existing")}
                            />
                            Existing Poet
                        </label>
                        <label>
                            <input
                                type="radio"
                                checked={writerOption === "new"}
                                onChange={() => setWriterOption("new")}
                            />
                            New Poet
                        </label>
                    </div>

                    {writerOption === "existing" ? (
                        <select
                            name="writer_id"
                            value={editForm.writer_id}
                            onChange={handleChange}
                        >
                            <option value="">Select Poet</option>
                            {writers.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            name="new_writer_name"
                            placeholder="New Poet Name"
                            value={editForm.new_writer_name}
                            onChange={handleChange}
                        />
                    )}

                    <label>Song Language</label>
                    <select
                        name="language"
                        value={editForm.language}
                        onChange={handleChange}
                    >
                        <option value="">Select Language</option>
                        {languageOptions.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
                    </select>

                    <label>Display Language</label>
                    <select
                        name="display_language"
                        value={editForm.display_language}
                        onChange={handleChange}
                    >
                        <option value="">Select Display Language</option>
                        {displayLanguageOptions.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
                    </select>

                    <label>Lyrics</label>
                    <textarea
                        name="lyrics"
                        value={editForm.lyrics}
                        onChange={handleChange}
                        style={{
                            fontFamily:
                                editForm.display_language === "urdu"
                                    ? "'Noto Nastaliq Urdu', serif"
                                    : "Comfortaa, Arial, sans-serif, Helvetica",
                            textAlign: "center",
                        }}
                    />

                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={() => setIsEditing(false)}>
                        Cancel
                    </button>
                </form>
            ) : (
                <>
                    <h1>{song.title}</h1>

                    <div className="controls-container">
                        {canEdit && (
                            <button
                                className="edit-button"
                                onClick={() => setIsEditing(true)}
                            >
                                <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                        )}

                        {/* <div className="lyrics-toggle-buttons">
              <p>{song.title}</p>
            </div> */}


                        <button className="like-button" onClick={handleLike}>
                            <FontAwesomeIcon icon={hasLiked ? solidHeart : outlineHeart} />
                        </button>
                    </div>

                    <div className="lyrics">
                        <pre
                            style={{
                                fontFamily:
                                    song.display_language === "urdu"
                                        ? "'Noto Nastaliq Urdu', serif"
                                        : "Comfortaa, Arial, sans-serif, Helvetica",
                            }}
                        >
                            {song.lyrics}
                        </pre>
                    </div>

                    <p className="writer-name-bottom">
                        <strong>Writer:</strong> {song.writers?.name || "Unknown"}
                    </p>

                    <p>
                        <strong>Uploaded by:</strong>{" "}
                        {song.profile?.username || "Unknown"}
                    </p>
                </>
            )}
        </div>
    );
};

export default SongDetails;
