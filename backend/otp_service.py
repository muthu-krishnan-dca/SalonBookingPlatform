import os
import smtplib
import urllib.request
import urllib.parse
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Ensure latest .env is loaded
load_dotenv(override=True)


def get_smtp_config():
    load_dotenv(override=True)
    server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", 587))
    user = os.getenv("SMTP_USER", "").strip()
    raw_pass = os.getenv("SMTP_PASS", "")
    # Remove spaces from Google App Password (e.g. "xxxx xxxx xxxx xxxx" -> "xxxxxxxxxxxxxxxx")
    password = raw_pass.replace(" ", "").strip() if raw_pass else ""
    return server, port, user, password


def send_real_email_otp(to_email: str, otp_code: str, user_name: str = "Valued Customer") -> tuple[bool, str]:
    """
    Sends a real OTP email to the user's inbox using Gmail SMTP.
    """
    server_host, server_port, smtp_user, smtp_pass = get_smtp_config()

    if not smtp_user or not smtp_pass:
        print(f"[OTP Service] SMTP credentials missing in .env. Target: {to_email}, Code: {otp_code}")
        return False, "SMTP credentials missing in backend/.env"

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Salon Booking Platform <{smtp_user}>"
        msg["To"] = to_email
        msg["Subject"] = f"🔑 {otp_code} is your Salon Booking Verification Code"

        text_body = f"Hello {user_name},\n\nYour One-Time Password (OTP) for password reset is: {otp_code}\n\nThis OTP is valid for 10 minutes.\n\nSalon Booking Platform Team"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }}
                .header {{ background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 30px 20px; text-align: center; color: #ffffff; }}
                .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; }}
                .content {{ padding: 30px 25px; text-align: center; color: #334155; }}
                .otp-box {{ margin: 25px auto; padding: 16px 28px; background: #f1f5f9; border: 2px dashed #8b5cf6; border-radius: 12px; display: inline-block; }}
                .otp-code {{ font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #6366f1; font-family: monospace; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✨ Salon Booking Platform</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Password Reset Verification</p>
                </div>
                <div class="content">
                    <p style="font-size: 16px;">Hello <strong>{user_name}</strong>,</p>
                    <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                    
                    <div class="otp-box">
                        <div class="otp-code">{otp_code}</div>
                    </div>
                    
                    <p style="font-size: 13px; color: #64748b;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                </div>
                <div class="footer">
                    &copy; 2026 Salon Booking Platform. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(server_host, server_port, timeout=12)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

        print(f"[OTP Service] SUCCESS: Real email delivered to {to_email}")
        return True, f"Real OTP email successfully delivered to {to_email}!"
    except Exception as e:
        print(f"[OTP Service] FAILED to send email to {to_email}:", e)
        return False, f"SMTP Error: {str(e)}"


def send_real_sms_otp(phone_number: str, otp_code: str) -> tuple[bool, str]:
    """
    Sends a real SMS to the Indian mobile number using Fast2SMS or 2Factor.
    """
    load_dotenv(override=True)
    fast2sms_key = os.getenv("FAST2SMS_API_KEY", "").strip()
    twofactor_key = os.getenv("TWOFACTOR_API_KEY", "").strip()

    clean_phone = "".join(filter(str.isdigit, phone_number))
    if clean_phone.startswith("91") and len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]

    # 1. Fast2SMS Provider (India)
    if fast2sms_key:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = {
                "variables_values": otp_code,
                "route": "otp",
                "numbers": clean_phone,
            }
            headers = {
                "authorization": fast2sms_key,
                "Content-Type": "application/json",
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                if res_data.get("return") is True:
                    print(f"[OTP Service] SUCCESS: Fast2SMS dispatched to {clean_phone}")
                    return True, f"Real SMS sent to +91 {clean_phone} via Fast2SMS!"
                else:
                    msg = res_data.get("message", ["SMS Error"])[0]
                    return False, f"Fast2SMS error: {msg}"
        except Exception as e:
            print(f"[OTP Service] Fast2SMS error for {clean_phone}:", e)

    # 2. 2Factor Provider (India)
    if twofactor_key:
        try:
            url = f"https://2factor.in/API/V1/{twofactor_key}/SMS/{clean_phone}/{otp_code}/AUTOGEN"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                if res_data.get("Status") == "Success":
                    print(f"[OTP Service] SUCCESS: 2Factor SMS dispatched to {clean_phone}")
                    return True, f"Real SMS sent to +91 {clean_phone} via 2Factor!"
        except Exception as e:
            print(f"[OTP Service] 2Factor error:", e)

    print(f"[OTP Service] FAST2SMS_API_KEY is not set in .env. Target: {clean_phone}, OTP: {otp_code}")
    return False, "FAST2SMS_API_KEY not configured in backend/.env"
