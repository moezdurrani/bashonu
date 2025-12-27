import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen } from "@fortawesome/free-solid-svg-icons";
import kidImage from "../assets/kid1.png";
import avatar from "../assets/avatar.png";
import { useLocation } from "react-router-dom";


const Profile = () => {
  // AUTH + PROFILE STATE
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loginError, setLoginError] = useState("");

  // SONG UPLOAD STATE
  const [songTitle, setSongTitle] = useState("");
  const [lyrics, setLyrics] = useState("");

  const [writers, setWriters] = useState([]);
  const [writerOption, setWriterOption] = useState("existing");
  const [selectedWriterId, setSelectedWriterId] = useState("");
  const [newWriterName, setNewWriterName] = useState("");

  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  // LANGUAGE ENUMS
  const [language, setLanguage] = useState("");
  const [displayLanguage, setDisplayLanguage] = useState("");

  const [languageOptions, setLanguageOptions] = useState([]);
  const [displayLanguageOptions, setDisplayLanguageOptions] = useState([]);

  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // LOAD USER, WRITERS, ENUMS
  useEffect(() => {
    checkUser();
    fetchWriters();
    fetchLanguageEnums();
  }, []);

  useEffect(() => {
    if (forgotPassword) {
      setPassword("");
      setLoginError("");
    }
  }, [forgotPassword]);

  useEffect(() => {
    if (location.state?.openUpload) {
      setShowUploadForm(true);
    }
  }, [location.state]);



  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setResetMessage(error.message);
    } else {
      setResetMessage("Password reset email sent. Check your inbox.");
    }
  };


  // FETCH ENUM VALUES
  const fetchLanguageEnums = async () => {
    try {
      const { data: langList } = await supabase.rpc("get_enum_values", {
        enum_name: "language_enum",
      });

      const { data: dispList } = await supabase.rpc("get_enum_values", {
        enum_name: "display_language_enum",
      });

      setLanguageOptions(langList || []);
      setDisplayLanguageOptions(dispList || []);
    } catch (err) {
      console.error("ENUM fetch failed", err);
    }
  };

  // FETCH WRITERS
  const fetchWriters = async () => {
    const { data, error } = await supabase
      .from("writers")
      .select("id, name")
      .order("name", { ascending: true });

    if (!error) setWriters(data);
  };

  // AUTH CHECK
  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      const { data: profileData } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username);
      }

      setEmail("");
      setPassword("");
    }

    setLoading(false);
  };

  // LOGIN/SIGNUP SUBMIT
  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setLoginError(error.message);
      setSignupSuccess(false);
    } else {
      if (!isLogin) {
        setSignupSuccess(true);
        setIsLogin(true);
        setEmail("");
        setPassword("");
      } else {
        checkUser();
      }
    }
  };

  // UPDATE USERNAME
  const updateUsername = async () => {
    const { error } = await supabase
      .from("profile")
      .update({ username })
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => ({ ...prev, username }));
      setIsEditing(false);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  // UPLOAD SONG
  const uploadSong = async () => {
    setUploadError("");
    setUploadSuccess("");

    if (
      !songTitle ||
      !lyrics ||
      !language ||
      !displayLanguage ||
      (writerOption === "existing" && !selectedWriterId) ||
      (writerOption === "new" && !newWriterName)
    ) {
      setUploadError("All fields are required");
      return;
    }

    try {
      let finalWriterId = selectedWriterId;

      if (writerOption === "new") {
        const { data: newWriter, error } = await supabase
          .from("writers")
          .insert([{ name: newWriterName }])
          .select("id")
          .single();

        if (error) throw error;
        finalWriterId = newWriter.id;
      }

      const { error } = await supabase.from("songs").insert([
        {
          title: songTitle,
          lyrics,
          language,
          display_language: displayLanguage,
          writer_id: finalWriterId,
          user_id: user.id,
          youtube_url: youtubeUrl || null,
        },
      ]);

      if (error) throw error;

      setUploadSuccess(`"${songTitle}" uploaded successfully!`);
      setShowUploadForm(false);
      // setTimeout(() => {
      //   setShowUploadForm(false);
      // }, 1200);

      // RESET FORM
      setSongTitle("");
      setLyrics("");
      setLanguage("");
      setDisplayLanguage("");
      setWriterOption("existing");
      setSelectedWriterId("");
      setNewWriterName("");
      setYoutubeUrl("");


      setTimeout(() => setUploadSuccess(""), 4000);
    } catch (err) {
      setUploadError(err.message);
    }
  };

  // LOADING SCREEN
  if (loading) return <div className="profile-loading">Loading...</div>;

  // LOGGED-IN VIEW
  if (user && profile) {
    return (
      <div className="profile-content">

        <div className="welcome-message">
          <div className="welcome-header">
            <img
              src={avatar}
              alt="Profile avatar"
              className="welcome-avatar"
            />

            <h1 className="welcome-text">
              Hello, <strong>{profile.username}</strong>
            </h1>
          </div>

          <h1 className="welcome-subtext">
            Thank you for preserving{" "}
            <strong>Chitral's</strong> and <strong>Gilgit Baltistan's</strong> Music!
          </h1>
        </div>

        {uploadSuccess && (
          <p className="upload-success">{uploadSuccess}</p>
        )}

        {/* USERNAME EDIT */}
        <div className="profile-info">
          {isEditing ? (
            <div className="form-group edit-username-group">
              <label>Username: </label>

              <input
                type="text"
                className="nice-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div className="edit-username-actions">
                <button onClick={updateUsername} className="auth-button">
                  Save
                </button>
                <button
                  type="button"
                  className="auth-button cancel-button"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="edit-username-button"
              onClick={() => setIsEditing(true)}
            >
              Edit username
            </button>
          )}
        </div>


        {/* ACTION BUTTONS */}
        <div className="profile-actions">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="toggle-upload-button"
          >
            {showUploadForm ? "Hide Upload Form" : "Upload Song"}
          </button>

          <button onClick={() => navigate("/my-songs")} className="my-songs">
            My Songs
          </button>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* UPLOAD FORM */}
        {showUploadForm && (
          <div className="song-upload-section">
            <h2>Upload a Song</h2>

            {uploadError && <p className="upload-error">{uploadError}</p>}
            {/* {uploadSuccess && <p className="upload-success">{uploadSuccess}</p>} */}

            <div className="form-group">
              <label>Song Title:</label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
              />
            </div>

            {/* WRITER SELECTION */}
            <div className="form-group">
              <label>Writer:</label>
              <div className="writer-selection">
                <label>
                  <input
                    type="radio"
                    name="writerOption"
                    value="existing"
                    checked={writerOption === "existing"}
                    onChange={() => setWriterOption("existing")}
                  />
                  <span>Select Existing Poet</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="writerOption"
                    value="new"
                    checked={writerOption === "new"}
                    onChange={() => setWriterOption("new")}
                  />
                  <span>Add New Poet</span>
                </label>
              </div>

              {writerOption === "existing" ? (
                <select
                  value={selectedWriterId}
                  onChange={(e) => setSelectedWriterId(e.target.value)}
                >
                  <option value="">Select a Poet</option>
                  {writers.map((writer) => (
                    <option key={writer.id} value={writer.id}>
                      {writer.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newWriterName}
                  onChange={(e) => setNewWriterName(e.target.value)}
                  placeholder="Enter new Poet name"
                />
              )}
            </div>

            {/* LANGUAGE */}
            <div className="form-group">
              <label>Song Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">Select Language</option>
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* DISPLAY LANGUAGE */}
            <div className="form-group">
              <label>Lyrics Script:</label>
              <select
                value={displayLanguage}
                onChange={(e) => setDisplayLanguage(e.target.value)}
              >
                <option value="">Select Display Language</option>
                {displayLanguageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* YOUTUBE LINK (OPTIONAL) */}
            <div className="form-group">
              <label>YouTube Link (optional):</label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube link here"
              />
            </div>


            {/* LYRICS FIELD */}
            <div className="form-group">
              <label>Lyrics:</label>
              <textarea
                value={lyrics}
                onChange={(e) => {
                  setLyrics(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                style={{
                  fontFamily:
                    displayLanguage === "urdu"
                      ? "'NafeesNastaleeq','Noto Nastaliq Urdu', serif"
                      : "Comfortaa, Arial, sans-serif, Helvetica",
                  textAlign: "center",
                }}
              />
            </div>

            <button onClick={uploadSong} className="upload-button">
              Upload Song
            </button>
          </div>
        )}
      </div>
    );
  }

  // LOGIN / SIGNUP PAGE
  return (
    <div className="profile-form">
      <h1>{isLogin ? "Login" : "Sign Up"}</h1>

      {signupSuccess && (
        <p className="signup-success">Signup successful! Please log in.</p>
      )}

      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {!forgotPassword && (
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}


        {loginError && <p className="login-error">{loginError}</p>}

        <button
          type="button"
          className="auth-button"
          onClick={forgotPassword ? handleForgotPassword : handleAuth}
        >
          {forgotPassword ? "Send Reset Email" : isLogin ? "Log In" : "Sign Up"}
        </button>

      </form>

      {isLogin && (
        <button
          className="toggle-button"
          onClick={() => {
            setForgotPassword(!forgotPassword);
            setResetMessage("");
          }}
        >
          {forgotPassword ? "Back to Login" : "Forgot password?"}
        </button>
      )}

      {resetMessage && (
        <p className="signup-success">{resetMessage}</p>
      )}





      <button className="toggle-button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Need to create an account? Sign Up" : "Already have an account? Log In"}
      </button>
    </div>
  );
};

export default Profile;
