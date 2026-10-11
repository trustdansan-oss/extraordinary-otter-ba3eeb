FAST Tracking Website — Direct Gmail Email Package

This ZIP contains the website pages and the Netlify Function for sending a formatted shipment email directly through Gmail. The tracking code, shipment details, message, and Northstar branding are included in the email.

SECURITY
- Never place the Gmail App Password in index.html, fast.html, or any public file.
- Keep it only in Netlify environment variables.

REQUIRED NETLIFY VARIABLES
- GMAIL_USER = the full Gmail address used to send the messages
- GMAIL_APP_PASSWORD = the Google App Password created for that same Gmail account (spaces are removed by the function)
- In Netlify, ensure both variables are available to Functions, not only Builds.

IMPORTANT
A ZIP cannot carry your private Gmail settings, and uploading files does not repair a Netlify deployment that is blocked. Netlify must successfully publish this package for the function to run. If a deploy is blocked by the private-repository Git contributor restriction, that account/repository permission must be resolved first, or the package must be deployed using a Netlify-supported build/deploy method that includes Functions.

PACKAGE CONTENTS
- index.html and fast.html — tracking website pages
- netlify/functions/send-email.mjs — direct Gmail sending function
- netlify.toml — Netlify function/build configuration
- package.json — Nodemailer dependency
- public/ — Northstar logo and site images

AFTER A SUCCESSFUL DEPLOY
1. Confirm the latest deploy says Published.
2. In Netlify, open Functions and confirm send-email exists.
3. Test with an email address you control.
4. If it fails, inspect the send-email function logs. The function logs only whether each setting exists; it never logs the secret value.
