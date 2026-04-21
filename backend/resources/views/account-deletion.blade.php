<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PawLink Account Deletion Request</title>
    <style>
        :root {
            --text: #1f2937;
            --muted: #6b7280;
            --brand: #eb4f33;
            --bg: #f8fafc;
            --card: #ffffff;
            --border: #e5e7eb;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: var(--text);
            background: linear-gradient(180deg, #fff7f5 0%, var(--bg) 260px);
        }

        .container {
            max-width: 760px;
            margin: 48px auto;
            padding: 0 16px;
        }

        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
        }

        h1 {
            margin: 0 0 12px 0;
            font-size: 28px;
            line-height: 1.2;
        }

        h2 {
            margin-top: 28px;
            margin-bottom: 10px;
            font-size: 20px;
        }

        p,
        li {
            line-height: 1.65;
        }

        .muted {
            color: var(--muted);
        }

        .steps {
            margin-top: 8px;
            padding-left: 22px;
        }

        .pill {
            display: inline-block;
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: #fff0ec;
            color: #9f2f1c;
            border: 1px solid #ffd8cf;
            font-size: 14px;
        }

        .cta {
            display: inline-block;
            margin-top: 10px;
            text-decoration: none;
            color: #ffffff;
            background: var(--brand);
            padding: 10px 16px;
            border-radius: 10px;
            font-weight: 600;
        }

        code {
            background: #f3f4f6;
            border-radius: 6px;
            padding: 2px 6px;
            font-size: 0.95em;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="card">
            <h1>PawLink Account Deletion</h1>
            <p class="muted">Updated: April 21, 2026</p>

            <p>If you want your PawLink account and associated personal data removed, you can request deletion using either of the methods below.</p>

            <h2>Option 1: Delete Directly in the App (Fastest)</h2>
            <ol class="steps">
                <li>Open PawLink and sign in to your account.</li>
                <li>Go to <strong>Privacy &amp; Security</strong>.</li>
                <li>Select <strong>Delete My Account</strong>.</li>
                <li>Enter your password and type <code>DELETE</code> to confirm.</li>
            </ol>
            <span class="pill">Deletion is immediate after successful confirmation in-app.</span>

            <h2>Option 2: Request Deletion by Email</h2>
            <p>If you cannot access the app, email us with your account email and deletion request.</p>
            <p>
                <strong>Email:</strong>
                <a href="mailto:support@pawlink.app?subject=PawLink%20Account%20Deletion%20Request">support@pawlink.app</a>
            </p>
            <p class="muted">For security verification, include the email tied to your PawLink account and a short confirmation that you want the account deleted.</p>

            <h2>What Happens After Deletion</h2>
            <ul class="steps">
                <li>Your profile image is removed.</li>
                <li>Active authentication tokens are revoked.</li>
                <li>Your account identifiers are removed or anonymized in production records.</li>
            </ul>

            <h2>Data That May Be Retained</h2>
            <p class="muted">We may retain limited records where legally required or needed for fraud prevention, dispute resolution, tax/accounting obligations, and platform security (for example payment and audit logs).</p>

            <p style="margin-top: 22px;">
                <a class="cta" href="/">Back to PawLink</a>
            </p>
        </div>
    </div>
</body>

</html>
