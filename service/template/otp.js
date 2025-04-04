const OTPTemplate = (OTP_CODE) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 500px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            padding: 15px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 8px 8px 0 0;
        }
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            padding: 10px;
            border: 2px dashed #007bff;
            display: inline-block;
            margin: 20px 0;
            letter-spacing: 3px;
        }
        .message {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 20px;
            font-size: 16px;
            color: white;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">Your OTP Code</div>
        <p class="message">Use the code below to verify your login. This OTP is valid for only <br> <strong>10 minutes</strong>.</p>
        <div class="otp-code">${OTP_CODE}</div>
        <p class="message">If you didn’t request this code, please ignore this email.</p>
       
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = OTPTemplate;
