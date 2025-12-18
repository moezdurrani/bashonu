import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setMessage("Please enter your new password");
            }
        });
    }, []);

    useEffect(() => {
        const loadSession = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                setMessage("Invalid or expired reset link.");
            }
        };

        loadSession();
    }, []);


    const updatePassword = async () => {
        if (!password) {
            setMessage("Please enter a new password");
            return;
        }

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Password updated successfully!");
            setTimeout(() => navigate("/profile"), 1500);
        }
    };


    return (
        <div className="reset-password-page">
            <div className="reset-password-form">
                <h1>Reset Password</h1>

                <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="auth-button" onClick={updatePassword}>
                    Update Password
                </button>

                {message && <p className="signup-success">{message}</p>}
            </div>
        </div>

    );
};

export default ResetPassword;
