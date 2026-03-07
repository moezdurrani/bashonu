import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SongDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as outlineHeart } from "@fortawesome/free-regular-svg-icons";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { faMagnifyingGlass, faMagnifyingGlassPlus, faMagnifyingGlassMinus, faShare, faComment, faPaperPlane, faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";

const SongDetails = () => {
  // const { id } = useParams();
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
  const lyricsRef = React.useRef(null);
  const [activeScript, setActiveScript] = useState(null);
  const [fontSize, setFontSize] = useState(16);
  const viewRegistered = React.useRef(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showCommentLoginMessage, setShowCommentLoginMessage] = useState(false);
  const commentsRef = React.useRef(null);
  const [commentsCount, setCommentsCount] = useState(0);

  const { slug } = useParams();
  const id = slug.split("-").pop(); // gets the last part after final hyphen

  const [contextMenu, setContextMenu] = useState(null); // { commentId, x, y }
  const [commentLikes, setCommentLikes] = useState({}); // { commentId: { count, hasLiked } }

  const fetchCommentLikes = async (commentIds) => {
    if (!commentIds.length) return;

    const { data: likesData } = await supabase
      .from("comment_likes")
      .select("comment_id, user_id")
      .in("comment_id", commentIds);

    const likesMap = {};
    commentIds.forEach(cid => {
      const likes = likesData?.filter(l => l.comment_id === cid) || [];
      likesMap[cid] = {
        count: likes.length,
        hasLiked: currentUser ? likes.some(l => l.user_id === currentUser.id) : false
      };
    });
    setCommentLikes(likesMap);
  };

  const handleCommentLike = async (commentId) => {
    setContextMenu(null);
    if (!currentUser) {
      setShowCommentLoginMessage(true);
      setTimeout(() => setShowCommentLoginMessage(false), 3000);
      return;
    }

    const already = commentLikes[commentId]?.hasLiked;

    // optimistic update
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: {
        count: (prev[commentId]?.count || 0) + (already ? -1 : 1),
        hasLiked: !already
      }
    }));

    if (already) {
      await supabase.from("comment_likes").delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUser.id);
    } else {
      await supabase.from("comment_likes").insert([{
        comment_id: commentId,
        user_id: currentUser.id
      }]);
    }
  };

  const handleLongPress = (e, commentId) => {
    e.preventDefault();

    // get coordinates from mouse or touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setContextMenu({
      commentId,
      x: clientX + 50,
      y: clientY - 50, // appear above the press point
    });
  };

  const detectCommentDirection = (text) => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicPattern.test(text) ? "rtl" : "ltr";
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("song_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profile")
        .select("id, username")
        .in("id", userIds);

      const commentsWithUsers = data.map(comment => ({
        ...comment,
        username: profiles?.find(p => p.id === comment.user_id)?.username || "Unknown"
      }));

      setComments(commentsWithUsers);
      fetchCommentLikes(data.map(c => c.id)); // add this
    }
    setCommentsLoading(false);
  };

  const formatCount = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return n;
  };

  const fetchCommentsCount = async () => {
    const { count } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("song_id", id)
      .is("parent_id", null);

    setCommentsCount(count || 0);
  };


  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
    setShowComments(prev => !prev);
  };

  const handleSubmitComment = async () => {
    if (!currentUser) {
      setShowCommentLoginMessage(true);
      setTimeout(() => setShowCommentLoginMessage(false), 3000);
      return;
    }
    if (!commentText.trim()) return;

    const { error } = await supabase
      .from("comments")
      .insert([{ song_id: parseInt(id), user_id: currentUser.id, content: commentText.trim() }]);

    if (!error) {
      setCommentText("");
      fetchComments(); // add this
    }
  };

  const handleDeleteComment = async (commentId) => {
    await supabase.from("comments").delete().eq("id", commentId);
    fetchComments();
    fetchCommentsCount(); // add
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          url: window.location.href,
        });
      } catch (error) {
        // user cancelled, do nothing
      }
    } else {
      // fallback for desktop - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const [editForm, setEditForm] = useState({
    title: "",
    lyrics_roman: "",
    lyrics_arabic: "",
    language: "",
    writer_id: "",
    new_writer_name: "",
    youtube_url: "",
  });



  useEffect(() => {
    fetchCurrentUser();
    fetchSongDetails();
    fetchWriters();
    fetchLanguageEnums();
    fetchCommentsCount();
  }, [id]);

  useEffect(() => {
    if (!showComments) return;

    const channel = supabase
      .channel(`comments-${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `song_id=eq.${id}`,
      }, () => {
        fetchComments();
        fetchCommentsCount();
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comment_likes",
      }, () => {
        fetchCommentLikes(comments.map(c => c.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [showComments, id, comments]);

  useEffect(() => {
    if (!showComments) return;

    const channel = supabase
      .channel(`comments-${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `song_id=eq.${id}`,
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [showComments, id]);

  useEffect(() => {
    if (isEditing && lyricsRef.current) {
      lyricsRef.current.style.height = "auto";
      lyricsRef.current.style.height =
        lyricsRef.current.scrollHeight + "px";
    }
  }, [isEditing, editForm.lyrics]);


  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;

    // youtu.be/VIDEO_ID
    if (url.includes("youtu.be/")) {
      return `https://www.youtube.com/embed/${url
        .split("youtu.be/")[1]
        .split("?")[0]}`;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (url.includes("watch?v=")) {
      return `https://www.youtube.com/embed/${url
        .split("watch?v=")[1]
        .split("&")[0]}`;
    }

    // already embed format
    if (url.includes("/embed/")) {
      return url;
    }

    return null;
  };

  const embedUrl = getYoutubeEmbedUrl(song?.youtube_url);



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

  const registerView = async (songId) => {
    const key = `song_view_${songId}`;
    const lastView = localStorage.getItem(key);
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    if (!lastView || now - parseInt(lastView) > ONE_HOUR) {
      await supabase.rpc("increment_views", { song_id: songId });
      localStorage.setItem(key, now.toString());
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

  useEffect(() => {
    if (viewRegistered.current) return;
    viewRegistered.current = true;
    registerView(parseInt(id));
  }, [id]);

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

      const hasRoman = !!songData.lyrics_roman;
      const hasArabic = !!songData.lyrics_arabic;

      if (hasRoman && hasArabic) {
        setActiveScript("roman"); // default preference
      } else if (hasArabic) {
        setActiveScript("arabic");
      } else {
        setActiveScript("roman");
      }

      setEditForm({
        title: songData.title,
        lyrics_roman: songData.lyrics_roman || "",
        lyrics_arabic: songData.lyrics_arabic || "",
        language: songData.language,
        writer_id: songData.writer_id,
        new_writer_name: "",
        youtube_url: songData.youtube_url || "",
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
    if (
      !editForm.lyrics_roman.trim() &&
      !editForm.lyrics_arabic.trim()
    ) {
      alert("Please add lyrics in at least one script (Roman or Arabic).");
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
          lyrics_roman: editForm.lyrics_roman || null,
          lyrics_arabic: editForm.lyrics_arabic || null,
          language: editForm.language,
          writer_id: finalWriterId,
          youtube_url: editForm.youtube_url || null,
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

  const hasRoman = !!song.lyrics_roman;
  const hasArabic = !!song.lyrics_arabic;

  const showToggle = hasRoman && hasArabic;

  const displayedLyrics =
    activeScript === "arabic"
      ? song.lyrics_arabic
      : song.lyrics_roman;

  const lyricsFont =
    activeScript === "arabic"
      ? "var(--font-arabic)"
      : "var(--font-main)";


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
            <label>YouTube Link (optional):</label>
            <input
              type="text"
              name="youtube_url"
              value={editForm.youtube_url || ""}
              onChange={handleInputChange}
              placeholder="Paste YouTube link here"
            />
          </div>

          <div className="form-group">
            <p className="lyrics-help-text">
              You can upload the song in Roman script, Arabic script, or both.
              Use the toggle below to switch between scripts while editing.
            </p>
          </div>

          <div className="script-toggle">
            <div
              className={`script-option ${activeScript === "roman" ? "active" : ""
                }`}
              onClick={() => setActiveScript("roman")}
            >
              Roman
            </div>

            <div
              className={`script-option ${activeScript === "arabic" ? "active" : ""
                }`}
              onClick={() => setActiveScript("arabic")}
            >
              Arabic
            </div>
          </div>

          <div className="form-group">
            <label className="lyrics-label">
              Lyrics ({activeScript === "arabic" ? "Arabic Script" : "Roman Script"}):
            </label>

            <textarea
              ref={lyricsRef}
              name={activeScript === "arabic" ? "lyrics_arabic" : "lyrics_roman"}
              value={
                activeScript === "arabic"
                  ? editForm.lyrics_arabic
                  : editForm.lyrics_roman
              }
              onChange={(e) => {
                const { name, value } = e.target;
                setEditForm((prev) => ({
                  ...prev,
                  [name]: value,
                }));

                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              style={{
                fontFamily:
                  activeScript === "arabic"
                    ? "var(--font-arabic)"
                    : "var(--font-main)",
                textAlign: "center",
                lineHeight: activeScript === "arabic" ? "2.4" : "1.8",
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
                  onClick={() => {
                    const hasRoman = !!editForm.lyrics_roman;
                    const hasArabic = !!editForm.lyrics_arabic;

                    if (hasRoman && hasArabic) {
                      setActiveScript("roman");
                    } else if (hasArabic) {
                      setActiveScript("arabic");
                    } else {
                      setActiveScript("roman");
                    }

                    setIsEditing(true);
                  }}
                >

                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              )}
            </div>
          </div>

          {showToggle && (
            <div className="script-toggle">
              <div
                className={`script-option ${activeScript === "roman" ? "active" : ""
                  }`}
                onClick={() => setActiveScript("roman")}
              >
                Roman
              </div>

              <div
                className={`script-option ${activeScript === "arabic" ? "active" : ""
                  }`}
                onClick={() => setActiveScript("arabic")}
              >
                Arabic
              </div>
            </div>
          )}

          <div className="lyrics">
            <pre style={{ fontFamily: lyricsFont, fontSize: `${fontSize}px` }}>
              {displayedLyrics}
            </pre>
          </div>

          <div className="font-size-controls">
            <button onClick={handleToggleComments} style={{ position: "relative" }}>
              <FontAwesomeIcon icon={faComment} />
              {commentsCount > 0 && (
                <span className="comment-count-badge">{formatCount(commentsCount)}</span>
              )}
            </button>
            <button onClick={() => setFontSize(f => Math.max(f - 2, 10))}>
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
            </button>
            <button onClick={() => setFontSize(16)}>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
            <button onClick={() => setFontSize(f => Math.min(f + 2, 32))}>
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleShare(); }}>
              <FontAwesomeIcon icon={faShare} />
            </button>
          </div>

          {/* <p className="uploader-name">
            <strong>Uploaded by:</strong>{" "}
            {song.profile?.username || "Unknown"}
          </p> */}

          {showComments && (
            <div className="comments-section" ref={commentsRef}>
              {showCommentLoginMessage && (
                <div className="login-message">Please log in to comment</div>
              )}
              <div className="comment-input-row">
                <input
                  type="text"
                  className="comment-input"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                  style={{
                    direction: detectCommentDirection(commentText),
                    fontFamily: detectCommentDirection(commentText) === "rtl"
                      ? "var(--font-arabic)" : "var(--font-main)",
                  }}
                />
                <button
                  className={`comment-send-btn ${!currentUser ? "disabled" : ""}`}
                  onClick={handleSubmitComment}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>

              {commentsLoading ? (
                <p className="comments-loading">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first!</p>
              ) : (
                <div className="comments-list">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="comment-item"
                      onContextMenu={(e) => handleLongPress(e, comment.id)}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        const timer = setTimeout(() => {
                          e.preventDefault();
                          setContextMenu({
                            commentId: comment.id,
                            x: touch.clientX,
                            y: touch.clientY - 70,
                          });
                        }, 500);
                        e.currentTarget._longPressTimer = timer;
                      }}
                      onTouchEnd={(e) => clearTimeout(e.currentTarget._longPressTimer)}
                      onTouchMove={(e) => clearTimeout(e.currentTarget._longPressTimer)}
                    >
                      <FontAwesomeIcon icon={faCircleUser} className="comment-avatar-icon" />
                      <div className="comment-body">
                        <div className="comment-header">
                          <div className="comment-meta">
                            <span className="comment-username">{comment.username}</span>
                            <span className="comment-date">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {currentUser && currentUser.id === comment.user_id && (
                            <button
                              className="comment-delete-btn"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <p
                          className="comment-content"
                          style={{
                            direction: detectCommentDirection(comment.content),
                            fontFamily: detectCommentDirection(comment.content) === "rtl"
                              ? "var(--font-arabic)" : "var(--font-main)",
                          }}
                        >
                          {comment.content}
                        </p>
                        {commentLikes[comment.id]?.count > 0 && (
                          <div className="comment-like-badge">
                            <FontAwesomeIcon icon={faThumbsUp} />
                            <span>{commentLikes[comment.id].count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Context menu */}
              {contextMenu && (
                <>
                  <div className="context-overlay" onClick={() => setContextMenu(null)} />
                  <div className="comment-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <button
                      className={`context-menu-btn ${commentLikes[contextMenu.commentId]?.hasLiked ? "liked" : ""}`}
                      onClick={() => handleCommentLike(contextMenu.commentId)}
                    >
                      <FontAwesomeIcon icon={faThumbsUp} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {embedUrl && (
            <div className="youtube-section">
              <h3>Listen on YouTube</h3>

              <div className="youtube-embed">
                <iframe
                  src={embedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}





        </>

      )}
    </div>
  );
};

export default SongDetails;