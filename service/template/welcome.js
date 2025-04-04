const welcomeTemplate = () => `
<!DOCTYPE html>
<html>
<head>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
            text-align: center;
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 10px;
        }
        .email-content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin-top: 10px;
            color: white;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            <h2>Welcome to Our Service!</h2>
            <p>Thank you for signing up. Click the button below to get started.</p>
            <a href="https://centoc.io/login" class="button">Get Started</a>
        </div>
    </div>
</body>
</html>

`;

module.exports = welcomeTemplate;