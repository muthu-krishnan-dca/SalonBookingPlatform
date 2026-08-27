import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {
    const navigate = useNavigate();

    // Step state: 1 = Enter Target, 2 = Enter & Verify OTP, 3 = Set New Password
    const [step, setStep] = useState(1);

    // Mode: "mobile" or "email"
    const [resetMode, setResetMode] = useState("mobile");
    const [target, setTarget] = useState("");
    const [otp, setOtp] = useState("");
    const [previewOtp, setPreviewOtp] = useState("");
    const [userName, setUserName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resendTimer, setResendTimer] = useState(0);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Resend countdown timer
    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // STEP 1: Request OTP
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setSuccess("");

        if (!target.trim()) {
            setError(
                resetMode === "mobile"
                    ? "Please enter your registered mobile number."
                    : "Please enter your registered email address."
            );
            return;
        }

        if (resetMode === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(target.trim())) {
                setError("Please enter a valid email address.");
                return;
            }
        } else {
            const phoneDigits = target.replace(/\D/g, "");
            if (phoneDigits.length < 7) {
                setError("Please enter a valid mobile number.");
                return;
            }
        }

        setSubmitting(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const res = await fetch("http://127.0.0.1:8000/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target: target.trim(),
                    mode: resetMode,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const data = await res.json();

            if (res.ok) {
                setUserName(data.user_name || "");
                setPreviewOtp(data.preview_otp || "");
                setSuccess(`Real OTP has been generated & sent to your ${resetMode === "mobile" ? "mobile number" : "email"}!`);
                setStep(2);
                setResendTimer(60); // 60 seconds countdown
            } else {
                setError(data.detail || "Unable to send OTP.");
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error("Send OTP error:", err);
            if (err.name === "AbortError") {
                setError("Server response timed out. Please check your network and retry.");
            } else {
                setError("Server connection error while generating OTP.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // STEP 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!otp.trim() || otp.trim().length !== 6) {
            setError("Please enter the 6-digit OTP received.");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target: target.trim(),
                    otp: otp.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("✅ OTP verified successfully! You can now set your new password.");
                setStep(3);
            } else {
                setError(data.detail || "Invalid OTP entered.");
            }
        } catch (err) {
            console.error("Verify OTP error:", err);
            setError("Server connection error during OTP verification.");
        } finally {
            setSubmitting(false);
        }
    };

    // STEP 3: Reset Password with OTP
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!newPassword) {
            setError("New password is required.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/reset-password-with-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target: target.trim(),
                    otp: otp.trim(),
                    new_password: newPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message || "Password reset successfully!");
                alert(`🎉 Password reset successfully for ${userName || "your account"}! You can now login.`);
                setTimeout(() => {
                    navigate("/login");
                }, 1600);
            } else {
                setError(data.detail || "Failed to reset password.");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setError("Server error while resetting password.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: "420px" }}>
                <div className="auth-header">
                    <h2>Reset Password</h2>
                    <p>
                        {step === 1 && "Select reset method and receive a real 6-digit OTP"}
                        {step === 2 && "Enter the 6-digit verification code sent to you"}
                        {step === 3 && "Create a secure new password for your account"}
                    </p>
                </div>

                {/* Progress Step Indicator */}
                <div className="otp-step-indicator">
                    <div className={`step-dot ${step >= 1 ? "active" : ""}`}>
                        <span>1</span>
                        <small>Identify</small>
                    </div>
                    <div className={`step-line ${step >= 2 ? "active" : ""}`} />
                    <div className={`step-dot ${step >= 2 ? "active" : ""}`}>
                        <span>2</span>
                        <small>Verify OTP</small>
                    </div>
                    <div className={`step-line ${step >= 3 ? "active" : ""}`} />
                    <div className={`step-dot ${step >= 3 ? "active" : ""}`}>
                        <span>3</span>
                        <small>New Password</small>
                    </div>
                </div>

                {error && <div className="alert error">⚠️ {error}</div>}
                {success && <div className="alert success">🎉 {success}</div>}

                {/* STEP 1: Select Method & Enter Target */}
                {step === 1 && (
                    <>
                        <div className="reset-mode-tabs">
                            <button
                                type="button"
                                className={`reset-mode-tab ${resetMode === "mobile" ? "active" : ""}`}
                                onClick={() => {
                                    setResetMode("mobile");
                                    setTarget("");
                                    setError("");
                                }}
                            >
                                📱 Mobile OTP
                            </button>
                            <button
                                type="button"
                                className={`reset-mode-tab ${resetMode === "email" ? "active" : ""}`}
                                onClick={() => {
                                    setResetMode("email");
                                    setTarget("");
                                    setError("");
                                }}
                            >
                                📧 Email OTP
                            </button>
                        </div>

                        <form onSubmit={handleSendOtp} className="auth-form" noValidate>
                            <div className="form-group">
                                <label>
                                    {resetMode === "mobile" ? "Registered Mobile Number *" : "Registered Email Address *"}
                                </label>
                                <input
                                    type={resetMode === "mobile" ? "tel" : "email"}
                                    placeholder={resetMode === "mobile" ? "e.g. 9876543210" : "e.g. name@example.com"}
                                    value={target}
                                    onChange={(e) => {
                                        setTarget(e.target.value);
                                        if (error) setError("");
                                    }}
                                    required
                                    autoFocus
                                />
                                <small className="form-helper-text">
                                    We will send a real 6-digit OTP to this {resetMode === "mobile" ? "number" : "email"}.
                                </small>
                            </div>

                            <button
                                type="submit"
                                className="auth-submit-btn"
                                disabled={submitting}
                            >
                                {submitting ? "SENDING OTP..." : "📨 SEND REAL OTP"}
                            </button>
                        </form>
                    </>
                )}

                {/* STEP 2: Verify 6-Digit OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
                        <div className="otp-sent-banner">
                            <span className="otp-target-label">
                                {resetMode === "mobile" ? "📱 Mobile:" : "📧 Email:"} <strong>{target}</strong>
                            </span>
                            {userName && <span className="otp-user-tag">Account: {userName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Enter 6-Digit OTP Code (from your {resetMode === "mobile" ? "SMS" : "Email"}) *</label>
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="• • • • • •"
                                value={otp}
                                onChange={(e) => {
                                    setOtp(e.target.value.replace(/\D/g, ""));
                                    if (error) setError("");
                                }}
                                className="otp-digit-input"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="otp-actions-row">
                            <button
                                type="button"
                                className="resend-otp-btn"
                                disabled={resendTimer > 0 || submitting}
                                onClick={() => handleSendOtp()}
                            >
                                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "🔄 Resend OTP"}
                            </button>

                            <button
                                type="button"
                                className="change-target-btn"
                                onClick={() => {
                                    setStep(1);
                                    setOtp("");
                                    setError("");
                                }}
                            >
                                Change {resetMode === "mobile" ? "Number" : "Email"}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={submitting || otp.length !== 6}
                        >
                            {submitting ? "VERIFYING..." : "✓ VERIFY OTP & PROCEED"}
                        </button>
                    </form>
                )}

                {/* STEP 3: Create New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="auth-form" noValidate>
                        <div className="form-group">
                            <label>New Password * (Min 6 chars)</label>
                            <input
                                type="password"
                                placeholder="Enter your new password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (error) setError("");
                                }}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password *</label>
                            <input
                                type="password"
                                placeholder="Re-enter your new password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (error) setError("");
                                }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? "UPDATING..." : "🔒 SAVE NEW PASSWORD"}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        Remember your password?{" "}
                        <Link to="/login" className="auth-link">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
